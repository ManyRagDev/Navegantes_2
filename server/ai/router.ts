import { buildClassifierMessages, fallbackClassifyIntent, intentClassificationSchema } from "./intents";
import { classifyIntentWithGroq, callGroqText } from "./providers/groq";
import { callPollinations } from "./providers/pollinations";
import type { AIChatContext, AIChatRouteResponse, ChatMessage, NearbyPlace } from "./types";
import { searchNearbyPlaces, searchPlacesByText } from "../places/googlePlaces";

const buildCaptainPersona = (mode: AIChatContext["mode"]) =>
  `Voce e um guia de viagem vintage e experiente chamado "O Capitao". ` +
  `Seu tom e nostalgico, encorajador e pratico. ` +
  `Voce ajuda o usuario a explorar ${mode === "mundo" ? "o Mundo" : "o Brasil"}. ` +
  `Seja objetivo, util e mantenha respostas curtas, com no maximo 2 paragrafos. ` +
  `Use emojis retro como 🧭, ⚓, 📜, 🗺️ quando fizer sentido.`;

const summarizePlacesForPrompt = (places: NearbyPlace[]) =>
  places
    .slice(0, 5)
    .map(
      (place, index) =>
        `${index + 1}. ${place.name} | ${place.address} | ${place.description} | distancia=${place.distanceMeters ?? "n/d"}m`,
    )
    .join("\n");

const buildNearbyNarrativeMessages = (message: string, context: AIChatContext, places: NearbyPlace[]): ChatMessage[] => [
  {
    role: "system",
    content: buildCaptainPersona(context.mode) + " Com base nos locais fornecidos, recomende ate 3 opcoes e explique rapidamente por que valem agora.",
  },
  {
    role: "user",
    content:
      `Pedido do usuario: ${message}\n` +
      `Cidade atual: ${context.userCity || "nao informada"}\n` +
      `Locais encontrados:\n${summarizePlacesForPrompt(places)}\n` +
      "Responda em portugues e priorize relevancia pratica.",
  },
];

const buildDeepNarrativeMessages = (message: string, context: AIChatContext, places: NearbyPlace[] = []): ChatMessage[] => [
  {
    role: "system",
    content: buildCaptainPersona(context.mode) + " Quando apropriado, conecte contexto historico e dicas de exploracao pouco obvias.",
  },
  {
    role: "user",
    content:
      `Mensagem do usuario: ${message}\n` +
      `Cidade ou contexto atual: ${context.userCity || "nao informado"}\n` +
      (places.length > 0 ? `Locais factuais disponiveis:\n${summarizePlacesForPrompt(places)}\n` : ""),
  },
];

const buildQuickReplyMessages = (message: string, context: AIChatContext): ChatMessage[] => [
  {
    role: "system",
    content: buildCaptainPersona(context.mode),
  },
  {
    role: "user",
    content:
      `Mensagem do usuario: ${message}\n` +
      `Cidade atual: ${context.userCity || "nao informada"}\n` +
      `Local selecionado: ${context.selectedPlaceName || "nenhum"}`,
  },
];

const buildGreetingMessages = (context: AIChatContext): ChatMessage[] => [
  {
    role: "system",
    content: buildCaptainPersona(context.mode) + " De as boas-vindas em uma resposta curta.",
  },
  {
    role: "user",
    content: `O usuario acabou de abrir o guia. Local atual: ${context.userCity || "localizacao nao identificada"}. Faca uma saudacao breve e calorosa.`,
  },
];

export const routeAIChat = async (message: string, context: AIChatContext = {}): Promise<AIChatRouteResponse> => {
  const classification = await classifyAIIntent(message, context);

  if (classification.confidence < 0.6 || classification.intent === "clarification") {
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
      },
    };
  }

  if (classification.intent === "nearby_discovery") {
    if (context.lat == null || context.lng == null) {
      return {
        ok: true,
        intent: "clarification",
        confidence: classification.confidence,
        executor: "clarification",
        text: "Preciso da sua localizacao para sugerir lugares perto de voce agora.",
        data: null,
        trace: {
          classification,
          usedPlaces: false,
          usedDeepModel: false,
        },
      };
    }

    const items = await searchNearbyPlaces({
      lat: context.lat,
      lng: context.lng,
      radiusMeters: 1800,
      mode: context.mode,
      placeQuery: classification.placeQuery,
    });
    const summary = await callGroqText(buildNearbyNarrativeMessages(message, context, items), {
      maxCompletionTokens: 220,
      temperature: 0.4,
    });

    return {
      ok: true,
      intent: classification.intent,
      confidence: classification.confidence,
      executor: "places+groq",
      text: summary.text,
      data: { items: items.slice(0, 6), city: context.userCity || null },
      trace: {
        classification,
        usedPlaces: true,
        usedDeepModel: false,
      },
    };
  }

  if (classification.intent === "itinerary_planning") {
    const places =
      context.lat != null && context.lng != null
        ? await searchNearbyPlaces({
            lat: context.lat,
            lng: context.lng,
            radiusMeters: 4500,
            mode: context.mode,
            placeQuery: classification.placeQuery || message,
          }).catch(() => [])
        : [];

    const reply = await callPollinations(buildDeepNarrativeMessages(message, context, places), "text");
    return {
      ok: true,
      intent: classification.intent,
      confidence: classification.confidence,
      executor: "pollinations",
      text: reply.text,
      data: places.length > 0 ? { items: places.slice(0, 5), city: context.userCity || null } : null,
      trace: {
        classification,
        usedPlaces: places.length > 0,
        usedDeepModel: true,
      },
    };
  }

  if (classification.intent === "neighborhood_story" || classification.intent === "comparison") {
    const reply = await callPollinations(buildDeepNarrativeMessages(message, context), "text");
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
      },
    };
  }

  const reply = await callGroqText(buildQuickReplyMessages(message, context), {
    maxCompletionTokens: 220,
    temperature: 0.35,
  });
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
    },
  };
};

export const classifyAIIntent = async (message: string, context: AIChatContext = {}) => {
  let classification;
  try {
    const groqResult = await classifyIntentWithGroq(buildClassifierMessages(message, context), intentClassificationSchema);
    classification = groqResult.data;
  } catch (error) {
    classification = fallbackClassifyIntent(message, context);
  }
  return classification;
};

export const buildCaptainGreeting = async (context: AIChatContext) => {
  const reply = await callGroqText(buildGreetingMessages(context), {
    maxCompletionTokens: 140,
    temperature: 0.5,
  });

  return reply.text;
};

export const getNearbySuggestions = async (input: {
  lat?: number | null;
  lng?: number | null;
  city?: string | null;
  mode?: "brasil" | "mundo" | null;
  placeQuery?: string | null;
  radiusMeters?: number;
  categories?: string[];
  moment?: string | null;
}) => {
  if (input.lat != null && input.lng != null) {
    return searchNearbyPlaces(input);
  }
  return searchPlacesByText(input);
};
