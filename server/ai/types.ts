export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AIProvider = "pollinations" | "gemini" | "groq";

export type SafetyProfile = "equilibrado" | "priorizar_seguranca";

export type IntentName =
  | "nearby_discovery"
  | "place_detail"
  | "neighborhood_story"
  | "itinerary_planning"
  | "comparison"
  | "quick_followup"
  | "smalltalk"
  | "clarification";

export type LocationScope = "current_location" | "selected_place" | "explicit_city" | "unknown";

export type ExecutorName =
  | "places"
  | "groq"
  | "pollinations"
  | "places+groq"
  | "places+pollinations"
  | "clarification";

export type IntentClassification = {
  intent: IntentName;
  confidence: number;
  needsPlacesSearch: boolean;
  needsDeepModel: boolean;
  locationScope: LocationScope;
  placeQuery: string | null;
  requestedCount: number | null;
  regionHint: string | null;
  categoryHint: string | null;
  safetyProfile: SafetyProfile;
  clarificationQuestion: string | null;
};

export type ConversationMemory = {
  lastIntent: IntentName | null;
  lastRegion: string | null;
  lastCategory: string | null;
  lastRequestedCount: number | null;
  safetyProfile: SafetyProfile;
  updatedAt: number;
};

export type NearbyPlace = {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceMeters: number | null;
  rating: number | null;
  userRatingsTotal: number | null;
  photoUrl: string;
  categories: string[];
  isOpenNow: boolean | null;
  icon: string;
  description: string;
  curationReason?: string;
  curationSource?: "heuristic" | "groq_editorial" | "heuristic_fallback";
  editorialScore?: number | null;
  urbanRole?: "destination" | "landmark" | "cultural_reference" | "local_gem" | "functional_service" | "transit_only";
  destinationValue?: "high" | "medium" | "low";
  worthDetour?: "high" | "medium" | "low";
};

export type EditorialSurface = "home" | "chat" | "itinerary" | "story";

export type EditorialReviewInput = {
  surface: EditorialSurface;
  mode?: "brasil" | "mundo" | null;
  safetyProfile?: SafetyProfile;
  query?: string | null;
  city?: string | null;
  requestedCount?: number | null;
  userLat?: number | null;
  userLng?: number | null;
  activeIntent?: IntentName | null;
};

export type EditorialReviewDecision = {
  placeId: string;
  keep: boolean;
  rank: number;
  score: number;
  reason: string;
  decision: "keep" | "drop";
  urbanRole: "destination" | "landmark" | "cultural_reference" | "local_gem" | "functional_service" | "transit_only";
  destinationValue: "high" | "medium" | "low";
  worthDetour: "high" | "medium" | "low";
  functionalOnly: boolean;
  explicitUtilityMatch: boolean;
};

export type EditorialReviewResult = {
  items: NearbyPlace[];
  droppedCount: number;
  reordered: boolean;
  reasonsByPlaceId: Record<string, string>;
  decisions: EditorialReviewDecision[];
  source: "groq_editorial" | "heuristic_fallback";
};

export type NearbySuggestionsDebug = {
  debugVersion: string;
  debugPipeline: "heuristic+groq_editorial" | "heuristic_fallback" | "heuristic_only";
  rawCount: number;
  curatedCount: number;
  finalCount: number;
  droppedByHeuristics: number;
  droppedByGroq: number;
  reorderedByGroq: boolean;
};

export type AIChatContext = {
  conversationId?: string | null;
  lat?: number | null;
  lng?: number | null;
  activeTab?: string | null;
  selectedPlaceId?: string | null;
  selectedPlaceName?: string | null;
  selectedPlaceAddress?: string | null;
  userCity?: string | null;
  mode?: "brasil" | "mundo" | null;
  recentIntent?: IntentName | null;
  recentRegion?: string | null;
  recentCategory?: string | null;
  requestedCount?: number | null;
  safetyProfile?: SafetyProfile | null;
};

export type AIChatRouteRequest = {
  message: string;
  context?: AIChatContext;
};

export type AIChatRouteResponse = {
  ok: true;
  intent: IntentName;
  confidence: number;
  executor: ExecutorName;
  text: string;
  data: {
    items?: NearbyPlace[];
    city?: string | null;
    requestedCount?: number | null;
    safetyProfile?: SafetyProfile;
    memory?: ConversationMemory | null;
  } | null;
  trace?: {
    classification: IntentClassification;
    usedPlaces: boolean;
    usedDeepModel: boolean;
    memory?: ConversationMemory | null;
    appliedRequestedCount?: number | null;
    appliedSafetyProfile?: SafetyProfile;
    resolvedIntent?: IntentName;
  };
};
