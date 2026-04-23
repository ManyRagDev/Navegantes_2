import {
  buildClassifierMessages,
  fallbackClassifyIntent,
  extractCategoryHint,
  extractPlaceQuery,
  extractRegionHint,
  extractRequestedCount,
  inferSafetyProfile,
  intentClassificationSchema,
  summarizeRecentContext,
} from "./intents";
import { getConversationMemory, mergeContextWithMemory, rememberConversationFromClassification } from "./context";
import { curateNearbyPlaces, inferCurationSurface } from "./curation";
import { applyAiSafetyFilter } from "./safetyFilter";
import { classifyIntentWithGroq, callGroqText } from "./providers/groq";
import { callPollinations } from "./providers/pollinations";
import type { AIChatContext, AIChatRouteResponse, ChatMessage, EditorialSurface, NearbyPlace, NearbySuggestionsDebug, SafetyProfile } from "./types";
import { searchNearbyPlaces, searchPlacesByText } from "../places/googlePlaces";

type NearbySuggestionInput = {
  lat?: number | null;
  lng?: number | null;
  city?: string | null;
  mode?: "brasil" | "mundo" | null;
  placeQuery?: string | null;
  radiusMeters?: number;
  categories?: string[];
  moment?: string | null;
  surface?: "home" | "chat" | "itinerary" | "story";
  intent?: "nearby_discovery" | "itinerary_planning" | "neighborhood_story" | "comparison" | "place_detail" | "quick_followup" | "smalltalk" | "clarification" | null;
  requestedCount?: number | null;
  safetyProfile?: SafetyProfile;
};

type CuratedNearbyResult = {
  items: NearbyPlace[];
  droppedByHeuristics: number;
  droppedByGroq: number;
  reorderedByGroq: boolean;
  aiReasons?: Record<string, string>;
  aiSource: "groq_editorial" | "heuristic_fallback" | "heuristic";
  rawCount: number;
  curatedCount: number;
};

export const EDITORIAL_DEBUG_VERSION = "editorial-v2-trace-1";

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const clampRequestedCount = (value?: number | null, fallback = 5) => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return fallback;
  return Math.max(1, Math.min(Math.floor(value), 10));
};

const logEditorialReview = (
  surface: EditorialSurface,
  result: CuratedNearbyResult,
) => {
  const roleDistribution = result.items.reduce<Record<string, number>>((acc, item) => {
    const role = item.urbanRole || "unspecified";
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});
  console.log("[editorialReview]", {
    surface,
    rawCount: result.rawCount,
    curatedCount: result.curatedCount,
    droppedByHeuristics: result.droppedByHeuristics,
    droppedByGroq: result.droppedByGroq,
    kept: result.items.length,
    reorderedByGroq: result.reorderedByGroq,
    aiSource: result.aiSource,
    aiReasons: result.aiReasons,
    roleDistribution,
    firstItems: result.items.slice(0, 3).map((item) => ({
      placeId: item.placeId,
      curationSource: item.curationSource || null,
      urbanRole: item.urbanRole || null,
      hasReason: Boolean(item.curationReason),
    })),
  });
};

const summarizeTraceItems = (items: NearbyPlace[]) =>
  items.slice(0, 3).map((item) => ({
    placeId: item.placeId,
    curationSource: item.curationSource || null,
    urbanRole: item.urbanRole || null,
    hasCurationReason: Boolean(item.curationReason),
  }));

const isNearbyFollowUpMessage = (message: string) => {
  const normalized = normalizeText(message);
  return /\b(traga|mais|outras|opcoes|opções|lugares|passeios|curtir|visitar|onde|o que tem|o que fazer)\b/.test(
    normalized,
  );
};

const buildCaptainPersona = (mode: AIChatContext["mode"], safetyProfile: SafetyProfile = "equilibrado") =>
  `Voce e um guia de viagem vintage e experiente chamado "O Capitao". ` +
  `Seu tom e nostalgico, encorajador e pratico. ` +
  `Voce ajuda o usuario a explorar ${mode === "mundo" ? "o Mundo" : "o Brasil"}. ` +
  `Seja objetivo, util e mantenha respostas curtas, com no maximo 2 paragrafos. ` +
  `Se o perfil de seguranca for ${safetyProfile}, priorize opcoes mais consolidadas e movimentadas, mas nao prometa seguranca absoluta. ` +
  `Use emojis retro como 🧭, ⚓, 📝, 🗺️ quando fizer sentido.`;

const summarizePlacesForPrompt = (places: NearbyPlace[], requestedCount: number) =>
  places
    .slice(0, Math.max(requestedCount, 5))
    .map(
      (place, index) =>
        `${index + 1}. ${place.name} | ${place.address} | ${place.description} | distancia=${place.distanceMeters ?? "n/d"}m | rating=${place.rating ?? "n/d"} | aberto=${place.isOpenNow === null ? "n/d" : place.isOpenNow ? "sim" : "nao"}`,
    )
    .join("\n");

const buildNearbyNarrativeMessages = (
  message: string,
  context: AIChatContext,
  places: NearbyPlace[],
  requestedCount: number,
): ChatMessage[] => [
    {
      role: "system",
      content:
        buildCaptainPersona(context.mode, context.safetyProfile || "equilibrado") +
        ` Com base nos locais fornecidos, recomende ate ${requestedCount} opcoes, sem inventar lugares fora da lista. ` +
        "Se houver menos opcoes confiaveis, diga quantas encontrou. " +
        "Nao fale em seguranca absoluta; use linguagem contextual sobre movimento, avaliacao e adequacao ao pedido.",
    },
    {
      role: "user",
      content:
        `Pedido do usuario: ${message}\n` +
        `Memoria recente: ${summarizeRecentContext(context)}\n` +
        `Cidade atual: ${context.userCity || "nao informada"}\n` +
        `Locais curados:\n${summarizePlacesForPrompt(places, requestedCount)}\n` +
        "Responda em portugues e priorize relevancia pratica.",
    },
  ];

const buildDeepNarrativeMessages = (
  message: string,
  context: AIChatContext,
  places: NearbyPlace[] = [],
  requestedCount = 5,
): ChatMessage[] => [
    {
      role: "system",
      content:
        buildCaptainPersona(context.mode, context.safetyProfile || "equilibrado") +
        " Quando apropriado, conecte contexto historico e dicas de exploracao pouco obvias. " +
        "Nao afirme seguranca absoluta; se citar risco, fale em termos contextuais e prudentes.",
    },
    {
      role: "user",
      content:
        `Mensagem do usuario: ${message}\n` +
        `Memoria recente: ${summarizeRecentContext(context)}\n` +
        `Cidade ou contexto atual: ${context.userCity || "nao informado"}\n` +
        (places.length > 0 ? `Locais factuais disponiveis:\n${summarizePlacesForPrompt(places, requestedCount)}\n` : ""),
    },
  ];

const buildQuickReplyMessages = (message: string, context: AIChatContext): ChatMessage[] => [
  {
    role: "system",
    content: buildCaptainPersona(context.mode, context.safetyProfile || "equilibrado"),
  },
  {
    role: "user",
    content:
      `Mensagem do usuario: ${message}\n` +
      `Memoria recente: ${summarizeRecentContext(context)}\n` +
      `Cidade atual: ${context.userCity || "nao informada"}\n` +
      `Local selecionado: ${context.selectedPlaceName || "nenhum"}`,
  },
];

const buildGreetingMessages = (context: AIChatContext): ChatMessage[] => [
  {
    role: "system",
    content:
      buildCaptainPersona(context.mode, context.safetyProfile || "equilibrado") +
      " De as boas-vindas em uma resposta curta.",
  },
  {
    role: "user",
    content: `O usuario acabou de abrir o guia. Local atual: ${context.userCity || "localizacao nao identificada"}. Faca uma saudacao breve e calorosa.`,
  },
];

const searchRawNearbyItems = async (input: NearbySuggestionInput, searchQuery: string | null) => {
  return input.lat != null && input.lng != null
    ? searchNearbyPlaces({
        lat: input.lat,
        lng: input.lng,
        radiusMeters: input.radiusMeters,
        mode: input.mode,
        placeQuery: searchQuery,
        categories: input.categories,
        moment: input.moment,
        city: input.city,
      })
    : searchPlacesByText({
        city: input.city,
        placeQuery: searchQuery,
        mode: input.mode,
        categories: input.categories,
        moment: input.moment,
        lat: input.lat,
        lng: input.lng,
      });
};

const reviewCuratedPlaces = async (
  rawItems: NearbyPlace[],
  curatedItems: NearbyPlace[],
  input: NearbySuggestionInput,
  surface: EditorialSurface,
  searchQuery: string | null,
): Promise<CuratedNearbyResult> => {
  const droppedByHeuristics = Math.max(0, rawItems.length - curatedItems.length);
  const heuristicsFallback: CuratedNearbyResult = {
    items: curatedItems.map((item) => ({
      ...item,
      curationSource: item.curationSource || "heuristic_fallback",
      curationReason: item.curationReason || "Fallback heuristico sem revisao Groq",
    })),
    droppedByHeuristics,
    droppedByGroq: 0,
    reorderedByGroq: false,
    aiSource: "heuristic_fallback",
    rawCount: rawItems.length,
    curatedCount: curatedItems.length,
  };

  console.log("[editorialReview][shortlist]", {
    surface,
    rawCount: rawItems.length,
    curatedCount: curatedItems.length,
    droppedByHeuristics,
    shortlist: summarizeTraceItems(curatedItems),
  });

  if (!["home", "chat"].includes(surface) || curatedItems.length === 0) {
    return {
      ...heuristicsFallback,
      aiSource: "heuristic",
      items: curatedItems.map((item) => ({
        ...item,
        curationSource: item.curationSource || "heuristic",
        curationReason: item.curationReason || "Curadoria heuristica sem etapa Groq para esta superficie",
      })),
    };
  }

  try {
    const aiReviewed = await applyAiSafetyFilter(curatedItems, {
      surface,
      mode: input.mode,
      safetyProfile: input.safetyProfile || "equilibrado",
      query: searchQuery,
      city: input.city || null,
      requestedCount: input.requestedCount || null,
      userLat: input.lat ?? null,
      userLng: input.lng ?? null,
      activeIntent: input.intent || null,
    });

    return {
      items: aiReviewed.items,
      droppedByHeuristics,
      droppedByGroq: aiReviewed.droppedCount,
      reorderedByGroq: aiReviewed.reordered,
      aiReasons: aiReviewed.reasonsByPlaceId,
      aiSource: aiReviewed.source,
      rawCount: rawItems.length,
      curatedCount: curatedItems.length,
    };
  } catch (error) {
    console.error("[editorialReview] Erro (fail-open):", error instanceof Error ? error.message : String(error));
    return heuristicsFallback;
  }
};

const resolveNearbySuggestions = async (
  input: NearbySuggestionInput,
  surface: EditorialSurface,
  searchQuery: string | null,
): Promise<CuratedNearbyResult> => {
  const rawItems = await searchRawNearbyItems(input, searchQuery);
  const curated = curateNearbyPlaces(rawItems, {
    surface,
    intent: input.intent || null,
    query: searchQuery,
    requestedCount: input.requestedCount || null,
    safetyProfile: input.safetyProfile || "equilibrado",
  });
  const reviewed = await reviewCuratedPlaces(rawItems, curated.items, input, surface, searchQuery);
  console.log("[editorialReview][final]", {
    surface,
    rawCount: rawItems.length,
    curatedCount: curated.items.length,
    finalCount: reviewed.items.length,
    droppedByGroq: reviewed.droppedByGroq,
    reorderedByGroq: reviewed.reorderedByGroq,
    finalItems: summarizeTraceItems(reviewed.items),
  });
  logEditorialReview(surface, reviewed);
  return reviewed;
};

export const getNearbySuggestionsDetailed = async (input: NearbySuggestionInput): Promise<{ items: NearbyPlace[]; debug: NearbySuggestionsDebug }> => {
  const surface = input.surface || inferCurationSurface({ intent: input.intent, query: input.placeQuery || input.city || null });
  const searchQuery = input.placeQuery || input.city || null;
  const reviewed = await resolveNearbySuggestions(input, surface, searchQuery);
  const debugPipeline =
    reviewed.aiSource === "groq_editorial"
      ? "heuristic+groq_editorial"
      : reviewed.aiSource === "heuristic_fallback"
        ? "heuristic_fallback"
        : "heuristic_only";

  return {
    items: reviewed.items,
    debug: {
      debugVersion: EDITORIAL_DEBUG_VERSION,
      debugPipeline,
      rawCount: reviewed.rawCount,
      curatedCount: reviewed.curatedCount,
      finalCount: reviewed.items.length,
      droppedByHeuristics: reviewed.droppedByHeuristics,
      droppedByGroq: reviewed.droppedByGroq,
      reorderedByGroq: reviewed.reorderedByGroq,
    },
  };
};

const hasLocationAnchor = (context: AIChatContext) => {
  return Boolean(
    (context.lat != null && context.lng != null) ||
    context.userCity ||
    context.selectedPlaceName ||
    context.recentRegion,
  );
};

const resolveIntentWithMemory = (message: string, context: AIChatContext, intent: AIChatContext["recentIntent"] | null, confidence: number) => {
  const normalized = normalizeText(message);
  const nearbyLike = isNearbyFollowUpMessage(message);

  if (
    (intent === "clarification" || confidence < 0.6 || intent === "quick_followup" || intent === "smalltalk") &&
    nearbyLike &&
    hasLocationAnchor(context)
  ) {
    return "nearby_discovery" as const;
  }

  if (
    (intent === "clarification" || confidence < 0.6) &&
    /\b(historia|bairro|regiao|origem|contexto cultural|memoria do lugar)\b/.test(normalized) &&
    context.recentIntent === "neighborhood_story"
  ) {
    return "neighborhood_story" as const;
  }

  return intent;
};

const resolveSearchQuery = (message: string, context: AIChatContext, classificationPlaceQuery: string | null, intent: AIChatContext["recentIntent"] | null) => {
  if (classificationPlaceQuery) return classificationPlaceQuery;
  if (context.recentRegion) return context.recentRegion;
  if (context.userCity) return context.userCity;
  if (intent === "nearby_discovery") return extractPlaceQuery(message, context);
  return extractPlaceQuery(message, context);
};

const resolveRoutingContext = async (message: string, context: AIChatContext = {}) => {
  const memory = getConversationMemory(context);
  const mergedContext = mergeContextWithMemory(context, memory);
  const fallbackClassification = fallbackClassifyIntent(message, mergedContext);

  let classification = fallbackClassification;
  try {
    const groqResult = await classifyIntentWithGroq(buildClassifierMessages(message, mergedContext), intentClassificationSchema);
    classification = groqResult.data;
  } catch {
    classification = fallbackClassification;
  }

  const resolvedIntent = resolveIntentWithMemory(message, mergedContext, classification.intent, classification.confidence);
  const requestedCount = clampRequestedCount(
    classification.requestedCount ?? mergedContext.requestedCount ?? extractRequestedCount(message, mergedContext),
    resolvedIntent === "nearby_discovery" ? 5 : 3,
  );
  const safetyProfile = classification.safetyProfile || mergedContext.safetyProfile || inferSafetyProfile(message, mergedContext);
  const regionHint = classification.regionHint || mergedContext.recentRegion || extractRegionHint(message, mergedContext);
  const categoryHint = classification.categoryHint || mergedContext.recentCategory || extractCategoryHint(message, mergedContext);
  const routeContext: AIChatContext = {
    ...mergedContext,
    recentIntent: resolvedIntent,
    recentRegion: regionHint,
    recentCategory: categoryHint,
    requestedCount,
    safetyProfile,
  };

  const resolvedClassification = {
    ...classification,
    intent: resolvedIntent,
    requestedCount,
    regionHint,
    categoryHint,
    safetyProfile,
    clarificationQuestion:
      resolvedIntent === "nearby_discovery" && !hasLocationAnchor(routeContext)
        ? "Voce quer lugares perto de voce agora ou em uma cidade/regiao especifica?"
        : classification.clarificationQuestion,
  };

  return {
    memory,
    context: routeContext,
    classification: resolvedClassification,
  };
};

export const routeAIChat = async (message: string, context: AIChatContext = {}): Promise<AIChatRouteResponse> => {
  const resolved = await resolveRoutingContext(message, context);
  const { classification } = resolved;

  if (classification.intent === "clarification") {
    return {
      ok: true,
      intent: "clarification",
      confidence: classification.confidence,
      executor: "clarification",
      text: classification.clarificationQuestion || "Voce quer lugares para visitar agora ou contexto sobre uma regiao especifica?",
      data: null,
      trace: {
        classification,
        usedPlaces: false,
        usedDeepModel: false,
        memory: resolved.memory,
        appliedRequestedCount: classification.requestedCount,
        appliedSafetyProfile: classification.safetyProfile,
        resolvedIntent: classification.intent,
      },
    };
  }

  if (classification.intent === "nearby_discovery") {
    if (!hasLocationAnchor(resolved.context)) {
      return {
        ok: true,
        intent: "clarification",
        confidence: classification.confidence,
        executor: "clarification",
        text: classification.clarificationQuestion || "Preciso da sua localizacao, cidade ou regiao para sugerir lugares perto de voce.",
        data: null,
        trace: {
          classification,
          usedPlaces: false,
          usedDeepModel: false,
          memory: resolved.memory,
          appliedRequestedCount: classification.requestedCount,
          appliedSafetyProfile: classification.safetyProfile,
          resolvedIntent: classification.intent,
        },
      };
    }

    const searchQuery = resolveSearchQuery(message, resolved.context, classification.placeQuery, classification.intent);
    const curated = await resolveNearbySuggestions(
      {
        lat: resolved.context.lat,
        lng: resolved.context.lng,
        city: resolved.context.userCity || null,
        mode: resolved.context.mode,
        placeQuery: searchQuery,
        radiusMeters: 1800,
        surface: "chat",
        intent: classification.intent,
        requestedCount: classification.requestedCount,
        safetyProfile: classification.safetyProfile,
      },
      "chat",
      searchQuery,
    );

    const summary = await callGroqText(buildNearbyNarrativeMessages(message, resolved.context, curated.items, classification.requestedCount || 5), {
      maxCompletionTokens: 220,
      temperature: 0.35,
    });

    rememberConversationFromClassification(message, resolved.context, classification);

    return {
      ok: true,
      intent: classification.intent,
      confidence: classification.confidence,
      executor: "places+groq",
      text: summary.text,
      data: {
        items: curated.items.slice(0, classification.requestedCount || 5),
        city: resolved.context.userCity || resolved.context.recentRegion || null,
        requestedCount: classification.requestedCount,
        safetyProfile: classification.safetyProfile,
        memory: resolved.memory,
      },
      trace: {
        classification,
        usedPlaces: true,
        usedDeepModel: false,
        memory: resolved.memory,
        appliedRequestedCount: classification.requestedCount,
        appliedSafetyProfile: classification.safetyProfile,
        resolvedIntent: classification.intent,
      },
    };
  }

  if (classification.intent === "itinerary_planning") {
    const searchQuery = resolveSearchQuery(message, resolved.context, classification.placeQuery, classification.intent);
    const places =
      resolved.context.lat != null && resolved.context.lng != null
        ? await searchNearbyPlaces({
          lat: resolved.context.lat,
          lng: resolved.context.lng,
          radiusMeters: 4500,
          mode: resolved.context.mode,
          placeQuery: searchQuery,
        }).catch(() => [])
        : await searchPlacesByText({
          placeQuery: searchQuery,
          city: resolved.context.userCity || null,
          mode: resolved.context.mode,
        }).catch(() => []);

    const curated = curateNearbyPlaces(places, {
      surface: "itinerary",
      intent: classification.intent,
      query: searchQuery,
      safetyProfile: classification.safetyProfile,
      requestedCount: classification.requestedCount || 5,
    });

    const reply = await callPollinations(
      buildDeepNarrativeMessages(message, resolved.context, curated.items, classification.requestedCount || 5),
      "text",
    );

    rememberConversationFromClassification(message, resolved.context, classification);

    return {
      ok: true,
      intent: classification.intent,
      confidence: classification.confidence,
      executor: "pollinations",
      text: reply.text,
      data: curated.items.length > 0 ? { items: curated.items.slice(0, 5), city: resolved.context.userCity || null, requestedCount: classification.requestedCount, safetyProfile: classification.safetyProfile, memory: resolved.memory } : null,
      trace: {
        classification,
        usedPlaces: curated.items.length > 0,
        usedDeepModel: true,
        memory: resolved.memory,
        appliedRequestedCount: classification.requestedCount,
        appliedSafetyProfile: classification.safetyProfile,
        resolvedIntent: classification.intent,
      },
    };
  }

  if (classification.intent === "neighborhood_story" || classification.intent === "comparison") {
    const reply = await callPollinations(buildDeepNarrativeMessages(message, resolved.context), "text");

    rememberConversationFromClassification(message, resolved.context, classification);

    return {
      ok: true,
      intent: classification.intent,
      confidence: classification.confidence,
      executor: "pollinations",
      text: reply.text,
      data: null,
      trace: {
        classification,
        usedPlaces: false,
        usedDeepModel: true,
        memory: resolved.memory,
        appliedRequestedCount: classification.requestedCount,
        appliedSafetyProfile: classification.safetyProfile,
        resolvedIntent: classification.intent,
      },
    };
  }

  const reply = await callGroqText(buildQuickReplyMessages(message, resolved.context), {
    maxCompletionTokens: 220,
    temperature: 0.35,
  });

  rememberConversationFromClassification(message, resolved.context, classification);

  return {
    ok: true,
    intent: classification.intent,
    confidence: classification.confidence,
    executor: "groq",
    text: reply.text,
    data: null,
    trace: {
      classification,
      usedPlaces: false,
      usedDeepModel: false,
      memory: resolved.memory,
      appliedRequestedCount: classification.requestedCount,
      appliedSafetyProfile: classification.safetyProfile,
      resolvedIntent: classification.intent,
    },
  };
};

export const classifyAIIntent = async (message: string, context: AIChatContext = {}) => {
  const memory = getConversationMemory(context);
  const mergedContext = mergeContextWithMemory(context, memory);

  try {
    const groqResult = await classifyIntentWithGroq(buildClassifierMessages(message, mergedContext), intentClassificationSchema);
    return groqResult.data;
  } catch {
    return fallbackClassifyIntent(message, mergedContext);
  }
};

export const buildCaptainGreeting = async (context: AIChatContext) => {
  const memory = getConversationMemory(context);
  const mergedContext = mergeContextWithMemory(context, memory);
  const reply = await callGroqText(buildGreetingMessages(mergedContext), {
    maxCompletionTokens: 140,
    temperature: 0.5,
  });

  rememberConversationFromClassification(
    "saudacao inicial",
    mergedContext,
    fallbackClassifyIntent("saudacao inicial", mergedContext),
  );

  return reply.text;
};

export const getNearbySuggestions = async (input: NearbySuggestionInput) => {
  const result = await getNearbySuggestionsDetailed(input);
  return result.items;
};
