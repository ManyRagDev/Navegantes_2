export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AIProvider = "pollinations" | "gemini" | "groq";

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
  clarificationQuestion: string | null;
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
};

export type AIChatContext = {
  lat?: number | null;
  lng?: number | null;
  activeTab?: string | null;
  selectedPlaceId?: string | null;
  selectedPlaceName?: string | null;
  selectedPlaceAddress?: string | null;
  userCity?: string | null;
  mode?: "brasil" | "mundo" | null;
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
  } | null;
  trace?: {
    classification: IntentClassification;
    usedPlaces: boolean;
    usedDeepModel: boolean;
  };
};
