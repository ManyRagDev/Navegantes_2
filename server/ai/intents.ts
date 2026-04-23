import type { AIChatContext, IntentClassification, IntentName, SafetyProfile } from "./types";

const INTENTS: IntentName[] = [
  "nearby_discovery",
  "place_detail",
  "neighborhood_story",
  "itinerary_planning",
  "comparison",
  "quick_followup",
  "smalltalk",
  "clarification",
];

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const safeTrim = (value: string) => value.replace(/\s+/g, " ").replace(/[?.!,;:]+$/g, "").trim();

const COUNT_WORDS: Record<string, number> = {
  uma: 1,
  um: 1,
  duas: 2,
  dois: 2,
  tres: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  sete: 7,
  oito: 8,
  nove: 9,
  dez: 10,
  onze: 11,
  doze: 12,
};

const CATEGORY_HINTS: Array<{ hint: string; patterns: RegExp[] }> = [
  { hint: "nightlife", patterns: [/\b(noite|balada|bar|samba|forro|show|role|curtir)\b/i] },
  { hint: "food", patterns: [/\b(comer|restaurante|cafe|cafeteria|padaria|almoco|janta|lanche)\b/i] },
  { hint: "culture", patterns: [/\b(museu|cultural|historia|historico|arte|bairro|regiao|tradicao)\b/i] },
  { hint: "outdoor", patterns: [/\b(parque|praia|trilha|mirante|ao ar livre|natureza)\b/i] },
  { hint: "shopping", patterns: [/\b(shopping|feira|mercado|livraria|compras)\b/i] },
  {
    hint: "utility",
    patterns: [/\b(motel|hotel|hospedagem|ubs|posto de saude|farmacia|clinica|hospital|tapecaria|autopecas|oficina|arena|estadio|escola)\b/i],
  },
];

const REGION_PATTERNS: RegExp[] = [
  /\b(?:perto|proximo(?:\s+ao|\s+de)?|na regiao de|no|na|em|por|pelo)\s+([a-z0-9\-\s]{3,60})/i,
];

const normalizeProfile = (profile?: string | null): SafetyProfile => {
  return profile === "priorizar_seguranca" ? "priorizar_seguranca" : "equilibrado";
};

const countFromDigits = (message: string) => {
  const match = message.match(/\b(\d{1,2})\s*(?:opcoes?|lugares?|passeios?|dicas?|locais?)\b/i);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? Math.min(value, 20) : null;
};

const countFromWords = (normalized: string) => {
  for (const [word, count] of Object.entries(COUNT_WORDS)) {
    if (new RegExp(`\\b${word}\\s+(?:opcoes?|lugares?|passeios?|dicas?|locais?)\\b`, "i").test(normalized)) {
      return count;
    }
  }
  return null;
};

const extractRegionFallback = (message: string) => {
  const normalized = normalizeText(message);
  for (const pattern of REGION_PATTERNS) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      const region = safeTrim(match[1]).replace(/^(do|da|de|dos|das)\s+/i, "");
      if (region.length >= 3 && region.length <= 60) return region;
    }
  }
  return null;
};

const matchCategoryHint = (message: string) => {
  const normalized = normalizeText(message);
  for (const entry of CATEGORY_HINTS) {
    if (entry.patterns.some((pattern) => pattern.test(normalized))) {
      return entry.hint;
    }
  }
  return null;
};

const hasNearbyFollowUpTone = (message: string) => {
  const normalized = normalizeText(message);
  return /\b(traga|mais|outras|opcoes|lugares|passeios|curtir|visitar|onde|o que tem|o que fazer)\b/.test(normalized);
};

const hasNearbySignal = (message: string) => {
  const normalized = normalizeText(message);
  return /\b(perto|proximo|agora|por aqui|ao redor|onde comer|onde visitar|o que tem|o que fazer|lugares|opcoes|passeios|curtir|visitar)\b/.test(normalized);
};

const inferRequestedCount = (message: string, context: AIChatContext = {}) => {
  return countFromDigits(message) || countFromWords(normalizeText(message)) || context.requestedCount || null;
};

const inferRegionHint = (message: string, context: AIChatContext = {}) => {
  const region = context.recentRegion || context.userCity || context.selectedPlaceName || extractRegionFallback(message);
  return region ? safeTrim(region) : null;
};

const inferCategoryHint = (message: string, context: AIChatContext = {}) => {
  return matchCategoryHint(message) || context.recentCategory || null;
};

export const extractRequestedCount = (message: string, context: AIChatContext = {}) => inferRequestedCount(message, context);

export const extractRegionHint = (message: string, context: AIChatContext = {}) => inferRegionHint(message, context);

export const extractCategoryHint = (message: string, context: AIChatContext = {}) => inferCategoryHint(message, context);

export const inferSafetyProfile = (message: string, context: AIChatContext = {}) => {
  if (context.safetyProfile) return normalizeProfile(context.safetyProfile);
  const normalized = normalizeText(message);
  if (/\b(mais seguro|prioriza(r|r a)? seguranca|priorizar seguranca|tranquilo|evitar risco|movimentado|menos arriscado)\b/.test(normalized)) {
    return "priorizar_seguranca";
  }
  return "equilibrado";
};

export const extractPlaceQuery = (message: string, context: AIChatContext = {}) => {
  const requestedCount = inferRequestedCount(message, context);
  const normalized = safeTrim(
    message
      .replace(/perto de mim/gi, "")
      .replace(/por aqui/gi, "")
      .replace(/agora/gi, "")
      .replace(/\b(?:umas?|algumas?|varias?)\s+(?:opcoes?|lugares?|passeios?|dicas?|locais?)\b/gi, "")
      .replace(/\b\d{1,2}\s*(?:opcoes?|lugares?|passeios?|dicas?|locais?)\b/gi, ""),
  );

  if (requestedCount && normalized.length > 2) return normalized;
  return normalized.length > 2 ? normalized : "lugares interessantes";
};

const isNearDiscoveryLike = (message: string, context: AIChatContext) => {
  if (hasNearbySignal(message)) return true;
  if (context.recentIntent !== "nearby_discovery") return false;
  return hasNearbyFollowUpTone(message);
};

export const summarizeRecentContext = (context: AIChatContext = {}) => {
  const summary = [
    context.recentIntent ? `intent_recente=${context.recentIntent}` : null,
    context.recentRegion ? `regiao_recente=${context.recentRegion}` : null,
    context.recentCategory ? `categoria_recente=${context.recentCategory}` : null,
    context.requestedCount ? `quantidade_recente=${context.requestedCount}` : null,
    `seguranca=${normalizeProfile(context.safetyProfile)}`,
  ].filter(Boolean);

  return summary.length > 0 ? summary.join(" | ") : "sem contexto recente";
};

export const intentClassificationSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    intent: {
      type: "string",
      enum: INTENTS,
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
    },
    needsPlacesSearch: {
      type: "boolean",
    },
    needsDeepModel: {
      type: "boolean",
    },
    locationScope: {
      type: "string",
      enum: ["current_location", "selected_place", "explicit_city", "unknown"],
    },
    placeQuery: {
      type: ["string", "null"],
    },
    requestedCount: {
      type: ["number", "null"],
      minimum: 1,
      maximum: 20,
    },
    regionHint: {
      type: ["string", "null"],
    },
    categoryHint: {
      type: ["string", "null"],
    },
    safetyProfile: {
      type: "string",
      enum: ["equilibrado", "priorizar_seguranca"],
    },
    clarificationQuestion: {
      type: ["string", "null"],
    },
  },
  required: [
    "intent",
    "confidence",
    "needsPlacesSearch",
    "needsDeepModel",
    "locationScope",
    "placeQuery",
    "requestedCount",
    "regionHint",
    "categoryHint",
    "safetyProfile",
    "clarificationQuestion",
  ],
} as const;

export const buildClassifierMessages = (message: string, context: AIChatContext = {}) => {
  const mode = context.mode === "mundo" ? "o Mundo" : "o Brasil";
  const requestedCount = inferRequestedCount(message, context);
  const regionHint = inferRegionHint(message, context);
  const categoryHint = inferCategoryHint(message, context);
  const safetyProfile = inferSafetyProfile(message, context);

  return [
    {
      role: "system" as const,
      content:
        "Classifique a intencao operacional da mensagem do usuario para um app de viagens. " +
        "Nao responda ao usuario. Retorne apenas o JSON pedido. " +
        "Use nearby_discovery para pedidos como o que tem perto, onde comer, o que visitar agora. " +
        "Use place_detail para pedir detalhes sobre um local especifico. " +
        "Use neighborhood_story para historia, clima cultural ou contexto de bairro/regiao. " +
        "Use itinerary_planning para montar roteiros. " +
        "Use comparison para comparar lugares/bairros/roteiros. " +
        "Use quick_followup para follow-up simples e objetivo. " +
        "Use smalltalk para conversa leve sem necessidade factual. " +
        "Use clarification quando faltar contexto essencial. " +
        "Se houver contexto recente, reutilize-o para evitar clarificacoes desnecessarias. " +
        "Se a mensagem pedir quantidade, preserve a quantidade. " +
        "Se houver indicacao de seguranca, considere o perfil de seguranca.",
    },
    {
      role: "user" as const,
      content: JSON.stringify({
        message,
        context: {
          ...context,
          modeLabel: mode,
          hasCoordinates: Boolean(context.lat != null && context.lng != null),
          hasSelectedPlace: Boolean(context.selectedPlaceName),
          recentContext: {
            recentIntent: context.recentIntent || null,
            recentRegion: context.recentRegion || null,
            recentCategory: context.recentCategory || null,
            requestedCount: context.requestedCount || null,
            safetyProfile: context.safetyProfile || null,
          },
          derivedHints: {
            requestedCount,
            regionHint,
            categoryHint,
            safetyProfile,
          },
        },
      }),
    },
  ];
};

export const fallbackClassifyIntent = (message: string, context: AIChatContext = {}): IntentClassification => {
  const normalized = normalizeText(message);
  const hasCoords = context.lat != null && context.lng != null;
  const requestedCount = inferRequestedCount(message, context);
  const regionHint = inferRegionHint(message, context);
  const categoryHint = inferCategoryHint(message, context);
  const safetyProfile = inferSafetyProfile(message, context);

  if (isNearDiscoveryLike(message, context)) {
    return {
      intent: "nearby_discovery",
      confidence: hasCoords ? 0.82 : 0.7,
      needsPlacesSearch: true,
      needsDeepModel: false,
      locationScope: hasCoords ? "current_location" : regionHint ? "explicit_city" : "unknown",
      placeQuery: extractPlaceQuery(message, context),
      requestedCount,
      regionHint,
      categoryHint,
      safetyProfile,
      clarificationQuestion: hasCoords || regionHint ? null : "Voce quer lugares perto de voce agora ou em uma cidade especifica?",
    };
  }

  if (/\b(historia|bairro|regiao|origem|contexto cultural|memoria do lugar)\b/.test(normalized)) {
    return {
      intent: "neighborhood_story",
      confidence: 0.78,
      needsPlacesSearch: false,
      needsDeepModel: true,
      locationScope: context.selectedPlaceName ? "selected_place" : context.userCity ? "explicit_city" : "unknown",
      placeQuery: null,
      requestedCount: null,
      regionHint,
      categoryHint,
      safetyProfile,
      clarificationQuestion: null,
    };
  }

  if (/\b(roteiro|itinerario|planej|dia inteiro|fim de semana|programa|programacao)\b/.test(normalized)) {
    return {
      intent: "itinerary_planning",
      confidence: 0.86,
      needsPlacesSearch: false,
      needsDeepModel: true,
      locationScope: context.userCity ? "explicit_city" : "unknown",
      placeQuery: extractPlaceQuery(message, context),
      requestedCount,
      regionHint,
      categoryHint,
      safetyProfile,
      clarificationQuestion: null,
    };
  }

  if (/\b(melhor|compar|versus|vs\.?)\b/.test(normalized)) {
    return {
      intent: "comparison",
      confidence: 0.76,
      needsPlacesSearch: false,
      needsDeepModel: true,
      locationScope: "unknown",
      placeQuery: null,
      requestedCount: null,
      regionHint,
      categoryHint,
      safetyProfile,
      clarificationQuestion: null,
    };
  }

  if (context.selectedPlaceName || /\b(esse lugar|este lugar|local|endereco)\b/.test(normalized)) {
    return {
      intent: "place_detail",
      confidence: 0.72,
      needsPlacesSearch: false,
      needsDeepModel: false,
      locationScope: context.selectedPlaceName ? "selected_place" : "unknown",
      placeQuery: null,
      requestedCount: null,
      regionHint,
      categoryHint,
      safetyProfile,
      clarificationQuestion: context.selectedPlaceName ? null : "Qual local voce quer que eu detalhe?",
    };
  }

  if (normalized.length < 30) {
    return {
      intent: "quick_followup",
      confidence: 0.62,
      needsPlacesSearch: false,
      needsDeepModel: false,
      locationScope: "unknown",
      placeQuery: extractPlaceQuery(message, context),
      requestedCount,
      regionHint,
      categoryHint,
      safetyProfile,
      clarificationQuestion: null,
    };
  }

  return {
    intent: "smalltalk",
    confidence: 0.55,
    needsPlacesSearch: false,
    needsDeepModel: false,
    locationScope: "unknown",
    placeQuery: null,
    requestedCount,
    regionHint,
    categoryHint,
    safetyProfile,
    clarificationQuestion:
      context.recentIntent || context.recentRegion || context.recentCategory
        ? null
        : "Voce quer lugares para visitar, detalhes de um local ou contexto sobre uma regiao?",
  };
};
