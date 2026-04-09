import type { AIChatContext, IntentClassification, IntentName } from "./types";

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
    "clarificationQuestion",
  ],
} as const;

export const buildClassifierMessages = (message: string, context: AIChatContext = {}) => {
  const mode = context.mode === "mundo" ? "o Mundo" : "o Brasil";
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
        "Use clarification quando faltar contexto essencial.",
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
        },
      }),
    },
  ];
};

export const fallbackClassifyIntent = (message: string, context: AIChatContext = {}): IntentClassification => {
  const normalized = message.toLowerCase();
  const hasCoords = context.lat != null && context.lng != null;

  if (/\b(perto|pr[oó]ximo|agora|por aqui|ao redor)\b/.test(normalized)) {
    return {
      intent: "nearby_discovery",
      confidence: hasCoords ? 0.82 : 0.68,
      needsPlacesSearch: true,
      needsDeepModel: false,
      locationScope: hasCoords ? "current_location" : "unknown",
      placeQuery: extractPlaceQuery(message),
      clarificationQuestion: hasCoords ? null : "Voce quer lugares perto de voce agora ou em uma cidade especifica?",
    };
  }

  if (/\b(hist[oó]ria|bairro|regi[aã]o|origem|contexto cultural)\b/.test(normalized)) {
    return {
      intent: "neighborhood_story",
      confidence: 0.78,
      needsPlacesSearch: false,
      needsDeepModel: true,
      locationScope: context.selectedPlaceName ? "selected_place" : context.userCity ? "explicit_city" : "unknown",
      placeQuery: null,
      clarificationQuestion: null,
    };
  }

  if (/\b(roteiro|itiner[aá]rio|planej|dia inteiro|fim de semana)\b/.test(normalized)) {
    return {
      intent: "itinerary_planning",
      confidence: 0.86,
      needsPlacesSearch: false,
      needsDeepModel: true,
      locationScope: context.userCity ? "explicit_city" : "unknown",
      placeQuery: null,
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
      clarificationQuestion: null,
    };
  }

  if (context.selectedPlaceName || /\b(esse lugar|este lugar|local|endere[cç]o)\b/.test(normalized)) {
    return {
      intent: "place_detail",
      confidence: 0.72,
      needsPlacesSearch: false,
      needsDeepModel: false,
      locationScope: context.selectedPlaceName ? "selected_place" : "unknown",
      placeQuery: null,
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
      placeQuery: null,
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
    clarificationQuestion: "Voce quer lugares para visitar, detalhes de um local ou contexto sobre uma regiao?",
  };
};

const extractPlaceQuery = (message: string) => {
  const normalized = message
    .replace(/perto de mim/gi, "")
    .replace(/por aqui/gi, "")
    .replace(/agora/gi, "")
    .trim();

  return normalized.length > 2 ? normalized : "lugares interessantes";
};
