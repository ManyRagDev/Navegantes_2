import { callGroqStructured } from "./providers/groq";
import type {
  EditorialReviewDecision,
  EditorialReviewInput,
  EditorialReviewResult,
  EditorialSurface,
  NearbyPlace,
} from "./types";

const SURFACE_POLICIES: Record<
  EditorialSurface,
  {
    objective: string;
    priorities: string[];
    audienceTone: string;
    allowUtilityIfExplicit: boolean;
  }
> = {
  home: {
    objective:
      "Montar uma vitrine editorial de descobertas proximas que realmente valem um desvio e representem bem o entorno imediato do usuario.",
    priorities: [
      "valor de descoberta",
      "relevancia para exploracao local",
      "autenticidade ou apelo memoravel",
      "qualidade percebida",
      "proximidade",
      "seguranca contextual",
    ],
    audienceTone: "mais conservador e curatorial",
    allowUtilityIfExplicit: false,
  },
  chat: {
    objective:
      "Responder ao pedido do usuario com opcoes factuais, coesas com o painel, mas mais sensiveis a intencao explicita e ao contexto da conversa.",
    priorities: [
      "relevancia ao pedido",
      "valor de descoberta",
      "autenticidade ou apelo local",
      "qualidade percebida",
      "proximidade",
      "seguranca contextual",
    ],
    audienceTone: "mais responsivo ao pedido textual",
    allowUtilityIfExplicit: true,
  },
  itinerary: {
    objective: "Selecionar paradas fortes para roteiro, evitando ruido utilitario e excesso de redundancia.",
    priorities: ["relevancia ao roteiro", "qualidade percebida", "proximidade", "seguranca contextual"],
    audienceTone: "planejamento pragmatico",
    allowUtilityIfExplicit: false,
  },
  story: {
    objective: "Apoiar uma narrativa de lugar com locais que tenham algum valor simbolico, cultural ou memoravel.",
    priorities: ["valor cultural", "autenticidade", "qualidade percebida", "seguranca contextual"],
    audienceTone: "editorial narrativo",
    allowUtilityIfExplicit: false,
  },
};

const editorialDecisionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    decisions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          placeId: { type: "string" },
          keep: { type: "boolean" },
          rank: { type: "integer", minimum: 1, maximum: 30 },
          score: { type: "number", minimum: 0, maximum: 100 },
          reason: { type: "string" },
          decision: { type: "string", enum: ["keep", "drop"] },
          urbanRole: {
            type: "string",
            enum: ["destination", "landmark", "cultural_reference", "local_gem", "functional_service", "transit_only"],
          },
          destinationValue: { type: "string", enum: ["high", "medium", "low"] },
          worthDetour: { type: "string", enum: ["high", "medium", "low"] },
          functionalOnly: { type: "boolean" },
          explicitUtilityMatch: { type: "boolean" },
        },
        required: [
          "placeId",
          "keep",
          "rank",
          "score",
          "reason",
          "decision",
          "urbanRole",
          "destinationValue",
          "worthDetour",
          "functionalOnly",
          "explicitUtilityMatch",
        ],
      },
    },
  },
  required: ["decisions"],
} as const;

const buildSystemPrompt = (input: EditorialReviewInput) => {
  const policy = SURFACE_POLICIES[input.surface];
  const modeLabel = input.mode === "mundo" ? "Mundo" : "Brasil";
  return (
    `Voce e o curador editorial rapido do Navegantes, um app de descoberta de lugares e planejamento de viagens com pegada retro de diario de bordo. ` +
    `Sua tarefa e revisar uma shortlist factual vinda do Google Places. Nunca invente fatos nem use conhecimento externo. ` +
    `Avalie apenas o que foi fornecido.\n\n` +
    `IDEIA CENTRAL: um lugar nao e turistico por tipo. Ele entra quando e tratado como destino, referencia urbana, experiencia memoravel ou ponto simbolico/social relevante. ` +
    `Ele cai quando funciona apenas como infraestrutura, passagem, conveniencia ou suporte cotidiano, salvo pedido utilitario explicito no chat.\n\n` +
    `SUPERFICIE: ${input.surface}\n` +
    `OBJETIVO: ${policy.objective}\n` +
    `TOM EDITORIAL: ${policy.audienceTone}\n` +
    `MODO: ${modeLabel}\n\n` +
    `PRIORIDADES EM ORDEM:\n- ${policy.priorities.join("\n- ")}\n\n` +
    `REGRAS GERAIS:\n` +
    `- Julgue papel cultural/social do lugar, nao apenas categoria bruta.\n` +
    `- Pergunte implicitamente: as pessoas vao ate esse lugar como destino, fazem desvio por ele, registram memoria dele, recomendam ele, ou apenas passam por ele?\n` +
    `- Favoreca lugares com cara de descoberta, experiencia memoravel, identidade local, valor simbolico, iconicidade urbana ou forte utilidade para pedido explicito.\n` +
    `- Nao promova seguranca absoluta. Use seguranca apenas como filtro contextual.\n` +
    `- Redes genericas, conveniencia comum, servicos cotidianos, academias, escolas, cursos, estacoes de passagem e lugares sem valor de destino tendem a cair, exceto quando houver forte sinal de iconicidade, valor cultural ou pedido explicito.\n` +
    `- Cadeias iconicas, mercados municipais, padarias tradicionais, shoppings com valor cultural, estações historicas e pontos queridos pela cidade podem ficar.\n` +
    `- Exemplos de queda: Smart Fit comum, Senac comum, escola tecnica comum, estacao de uso cotidiano sem valor simbolico forte.\n` +
    `- Exemplos de permanencia: mercado municipal emblematico, estacao historica reconhecida, galeria cultural, padaria tradicional celebrada, ponto urbano iconico.\n` +
    `- ${policy.allowUtilityIfExplicit ? "Pedidos utilitarios explicitos do usuario podem ser atendidos se houver relevancia clara." : "Pedidos utilitarios so devem aparecer se forem claramente memoraveis ou se vierem como excecao fortissima."}\n` +
    `- Para home: mantenha apenas lugares com valor de destino claro. Lugares apenas funcionais devem cair.\n` +
    `- Para chat: mantenha lugares com valor de destino claro. Lugares funcionais so ficam quando houver pedido utilitario explicito e boa adequacao factual.\n` +
    `- Se a lista tiver varios bons candidatos, reordene por relevancia editorial. Se tiver duvidas entre manter e remover, prefira remover quando o lugar parecer apenas funcional.\n` +
    `- Retorne uma decisao para cada placeId enviado.\n`
  );
};

const buildUserPrompt = (places: NearbyPlace[], input: EditorialReviewInput) => {
  const policy = SURFACE_POLICIES[input.surface];
  const candidates = places.map((place, index) => ({
    originalRank: index + 1,
    placeId: place.placeId,
    name: place.name,
    address: place.address,
    description: place.description,
    categories: place.categories.slice(0, 6),
    distanceMeters: place.distanceMeters,
    rating: place.rating,
    userRatingsTotal: place.userRatingsTotal,
    isOpenNow: place.isOpenNow,
    hasPhoto: Boolean(place.photoUrl),
  }));

  return JSON.stringify({
    context: {
      surface: input.surface,
      mode: input.mode || "brasil",
      safetyProfile: input.safetyProfile || "equilibrado",
      query: input.query || null,
      city: input.city || null,
      requestedCount: input.requestedCount || null,
      activeIntent: input.activeIntent || null,
      userLocationKnown: Boolean(input.userLat != null && input.userLng != null),
      surfaceObjective: policy.objective,
      priorities: policy.priorities,
    },
    outputInstructions: {
      keepDefinition:
        "keep=true apenas quando o lugar merece continuar na shortlist editorial final dessa superficie.",
      rankDefinition:
        "rank deve ordenar apenas os lugares mantidos. Para descartados, mantenha um rank coerente mas eles serao ignorados.",
      reasonDefinition:
        "reason deve ser curta, concreta e mencionar papel urbano/social, valor de destino, iconicidade, memorabilidade, utilidade explicita ou inadequacao.",
    },
    candidates,
  });
};

const applySurfaceDecisionPolicy = (decision: EditorialReviewDecision, input: EditorialReviewInput) => {
  if (input.surface === "home") {
    const failsDestinationGate =
      decision.functionalOnly ||
      decision.urbanRole === "functional_service" ||
      decision.urbanRole === "transit_only" ||
      decision.destinationValue === "low" ||
      decision.worthDetour === "low";

    if (failsDestinationGate) {
      return {
        ...decision,
        keep: false,
        decision: "drop" as const,
        reason: `${decision.reason} Reprovado no gate de destino da home.`,
      };
    }
  }

  if (input.surface === "chat") {
    const isFunctional = decision.functionalOnly || decision.urbanRole === "functional_service" || decision.urbanRole === "transit_only";
    const lacksDestinationValue = decision.destinationValue === "low" || decision.worthDetour === "low";

    if (isFunctional && !decision.explicitUtilityMatch) {
      return {
        ...decision,
        keep: false,
        decision: "drop" as const,
        reason: `${decision.reason} Reprovado por ser funcional sem pedido utilitario explicito.`,
      };
    }

    if (!decision.explicitUtilityMatch && lacksDestinationValue) {
      return {
        ...decision,
        keep: false,
        decision: "drop" as const,
        reason: `${decision.reason} Reprovado por baixo valor de destino no chat.`,
      };
    }
  }

  return decision;
};

const normalizeDecisions = (places: NearbyPlace[], decisions: EditorialReviewDecision[]) => {
  const byId = new Map(decisions.map((decision) => [decision.placeId, decision]));
  return places.map((place, index) => {
    const decision = byId.get(place.placeId);
    if (decision) return decision;
    return {
      placeId: place.placeId,
      keep: true,
      rank: index + 1,
      score: 50,
      reason: "Mantido por fallback de decisao ausente.",
      decision: "keep" as const,
      urbanRole: "local_gem" as const,
      destinationValue: "medium" as const,
      worthDetour: "medium" as const,
      functionalOnly: false,
      explicitUtilityMatch: false,
    };
  });
};

export const applyAiSafetyFilter = async (
  places: NearbyPlace[],
  input: EditorialReviewInput,
): Promise<EditorialReviewResult> => {
  console.log("[editorialReview][groq][start]", {
    surface: input.surface,
    query: input.query || null,
    requestedCount: input.requestedCount || null,
    placesCount: places.length,
    firstPlaceIds: places.slice(0, 3).map((place) => place.placeId),
  });

  if (places.length === 0) {
    return {
      items: [],
      droppedCount: 0,
      reordered: false,
      reasonsByPlaceId: {},
      decisions: [],
      source: "heuristic_fallback",
    };
  }

  let result;
  try {
    result = await callGroqStructured<{ decisions: EditorialReviewDecision[] }>(
      [
        { role: "system", content: buildSystemPrompt(input) },
        { role: "user", content: buildUserPrompt(places, input) },
      ],
      "editorial_review",
      editorialDecisionSchema,
      { temperature: 0.1, maxCompletionTokens: 700 },
    );
  } catch (error) {
    console.error("[editorialReview][groq][error]", {
      surface: input.surface,
      query: input.query || null,
      failOpen: true,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }

  const normalizedDecisions = normalizeDecisions(places, result.data.decisions || []).map((decision) =>
    applySurfaceDecisionPolicy(decision, input),
  );
  const decisionsByPlaceId = new Map(normalizedDecisions.map((decision) => [decision.placeId, decision]));
  const keptWithDecision = places
    .map((place, originalIndex) => ({ place, originalIndex, decision: decisionsByPlaceId.get(place.placeId)! }))
    .filter((entry) => entry.decision.keep && entry.decision.decision === "keep")
    .sort((left, right) => {
      if (left.decision.rank !== right.decision.rank) return left.decision.rank - right.decision.rank;
      if (left.decision.score !== right.decision.score) return right.decision.score - left.decision.score;
      return left.originalIndex - right.originalIndex;
    });

  const items = keptWithDecision.map(({ place, decision }) => ({
    ...place,
    curationReason: decision.reason,
    curationSource: "groq_editorial" as const,
    editorialScore: decision.score,
    urbanRole: decision.urbanRole,
    destinationValue: decision.destinationValue,
    worthDetour: decision.worthDetour,
  }));

  const reasonsByPlaceId = normalizedDecisions.reduce<Record<string, string>>((acc, decision) => {
    acc[decision.placeId] = decision.reason;
    return acc;
  }, {});

  const reordered = keptWithDecision.some((entry, index) => entry.originalIndex !== index);

  console.log("[editorialReview][groq][success]", {
    surface: input.surface,
    decisionsCount: normalizedDecisions.length,
    keptCount: items.length,
    firstDecisionSample: normalizedDecisions.slice(0, 3).map((decision) => ({
      placeId: decision.placeId,
      keep: decision.keep,
      urbanRole: decision.urbanRole,
      destinationValue: decision.destinationValue,
      worthDetour: decision.worthDetour,
    })),
  });

  return {
    items,
    droppedCount: Math.max(0, places.length - items.length),
    reordered,
    reasonsByPlaceId,
    decisions: normalizedDecisions,
    source: "groq_editorial",
  };
};
