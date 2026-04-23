import type { NearbyPlace } from "../ai/types";

export type CuratedProfile = "home_curated" | "chat_balanced" | "explicit_user_request";
export type VenueTier = "core" | "balanced" | "conditional" | "restricted" | "blocked";

export type PlacesCurationInput = {
  categories?: string[];
  mode?: "brasil" | "mundo" | null;
  moment?: string | null;
  placeQuery?: string | null;
  city?: string | null;
};

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const compactValues = (values: Array<string | null | undefined>) =>
  values.filter((value): value is string => typeof value === "string" && value.trim().length > 0);

const joinSearchTerms = (values: Array<string | null | undefined>) => normalizeText(compactValues(values).join(" "));

export const normalizeCurationText = normalizeText;

export const buildRequestBlob = (input: PlacesCurationInput) => joinSearchTerms([input.placeQuery, ...(input.categories || [])]);

export const buildPlaceBlob = (place: NearbyPlace) =>
  joinSearchTerms([place.name, place.address, place.description, ...(place.categories || [])]);

const containsAnyHint = (blob: string, hints: string[]) => {
  if (!blob) return false;
  const padded = ` ${blob} `;
  return hints.some((hint) => {
    const normalizedHint = normalizeText(hint);
    if (!normalizedHint) return false;
    return padded.includes(` ${normalizedHint} `);
  });
};

const intersectsTypes = (values: string[], candidates: string[]) => {
  if (values.length === 0 || candidates.length === 0) return false;
  const normalizedValues = new Set(values.map(normalizeText));
  return candidates.some((candidate) => normalizedValues.has(normalizeText(candidate)));
};

const CORE_TYPES = [
  "tourist_attraction",
  "museum",
  "park",
  "art_gallery",
  "cafe",
  "restaurant",
  "bakery",
  "bar",
  "book_store",
  "library",
  "movie_theater",
  "amusement_park",
  "shopping_mall",
  "beach",
  "aquarium",
  "zoo",
  "cultural_center",
  "viewpoint",
  "church",
];

const BALANCED_TYPES = ["night_club", "bowling_alley", "spa", "casino"];

const RESTRICTED_TYPES = [
  "lodging",
  "hotel",
  "motel",
  "hostel",
  "resort_hotel",
  "guest_house",
  "hospital",
  "doctor",
  "pharmacy",
  "dentist",
  "health",
  "school",
  "university",
  "training_center",
  "bus_station",
  "train_station",
  "parking",
  "gas_station",
  "car_repair",
  "auto_parts_store",
  "hardware_store",
  "home_goods_store",
  "store",
  "local_government_office",
  "city_hall",
  "event_venue",
  "stadium",
  "sports_complex",
  "gym",
  "bank",
  "atm",
  "travel_agency",
  "real_estate_agency",
  "laundry",
  "dry_cleaning",
  "storage",
  "moving_company",
  "plumber",
  "electrician",
  "general_contractor",
  "insurance_agency",
  "lawyer",
  "accounting",
  "taxi_stand",
  "veterinary_care",
  "pet_store",
];

/**
 * CONDITIONAL TYPES — Places that are blocked UNLESS they're landmarks.
 * A "landmark" has high popularity (many reviews + good rating).
 * Examples: Méqui 1000 Paulista (15k reviews) = ALLOWED; random Subway (12 reviews) = BLOCKED.
 */
const CONDITIONAL_TYPES = [
  "fast_food_restaurant",
  "meal_takeaway",
  "meal_delivery",
  "supermarket",
  "grocery_or_supermarket",
  "convenience_store",
  "department_store",
  "clothing_store",
  "shoe_store",
  "electronics_store",
  "furniture_store",
  "beauty_salon",
  "hair_care",
];

/** Minimum thresholds for a conditional venue to be considered a "landmark worth a detour". */
const LANDMARK_MIN_REVIEWS = 500;
const LANDMARK_MIN_RATING = 4.0;

export const isLandmark = (place: NearbyPlace): boolean => {
  const reviews = place.userRatingsTotal ?? 0;
  const rating = place.rating ?? 0;
  return reviews >= LANDMARK_MIN_REVIEWS && rating >= LANDMARK_MIN_RATING;
};

const BLOCKED_TYPES = ["funeral_home", "cemetery", "prison", "police", "fire_station", "courthouse", "embassy"];

const DIRECT_RESTRICTED_TYPES = [
  "lodging",
  "hospital",
  "doctor",
  "pharmacy",
  "dentist",
  "health",
  "school",
  "university",
  "training_center",
  "bus_station",
  "train_station",
  "parking",
  "gas_station",
  "car_repair",
  "auto_parts_store",
  "hardware_store",
  "home_goods_store",
  "store",
  "supermarket",
  "convenience_store",
  "local_government_office",
  "city_hall",
  "event_venue",
  "stadium",
  "sports_complex",
  "gym",
  "bank",
  "atm",
  "travel_agency",
  "real_estate_agency",
];

const CORE_HINTS = [
  "tourist attraction",
  "atracao",
  "atracoes",
  "passeio",
  "passeios",
  "visitar",
  "turismo",
  "pontos turisticos",
  "lugares para visitar",
  "lugares interessantes",
  "pontos culturais",
  "cultural",
  "cultura",
  "museu",
  "arte",
  "parque",
  "praia",
  "ao ar livre",
  "mirante",
  "trilha",
  "cafe",
  "restaurante",
  "padaria",
  "bar",
  "livraria",
  "biblioteca",
  "cinema",
  "teatro",
  "shopping",
  "shopping mall",
];

const BALANCED_HINTS = ["balada", "noite", "night", "boate", "night club", "samba", "show", "karaoke", "lounge", "club"];

const RESTRICTED_HINTS = [
  "motel",
  "hotel",
  "hoteis",
  "pousada",
  "hostel",
  "hospedagem",
  "ubs",
  "upa",
  "posto de saude",
  "saude",
  "hospital",
  "clinica",
  "farmacia",
  "academia",
  "tecnico",
  "tecnica",
  "curso tecnico",
  "escola tecnica",
  "senai",
  "senac",
  "faculdade",
  "universidade",
  "escola",
  "colegio",
  "gas",
  "gasolina",
  "posto de gasolina",
  "combustivel",
  "tapecaria",
  "estofaria",
  "ferragem",
  "autopecas",
  "oficina",
  "mecanica",
  "borracharia",
  "lava rapido",
  "arena",
  "estadio",
  "ginasio",
  "quadra",
  "campo de futebol",
  "estacionamento",
  "terminal",
  "rodoviaria",
  "festa",
  "festas",
  "evento",
  "eventos",
  "salao de festas",
];

const BLOCKED_HINTS = ["cemiterio", "funeraria", "presidio", "cadeia", "prisao", "policia", "delegacia", "strip club", "sex shop", "adult store"];

const HOME_QUERY_HINTS = [
  "lugares para visitar",
  "pontos turisticos",
  "ponto turistico",
  "o que tem de bacana",
  "lugares interessantes",
  "pontos culturais",
  "cafe e pontos culturais",
  "cafes e pontos culturais",
  "passeios legais",
  "perto de voce",
  "perto de mim",
  "atracoes",
];

const REQUEST_TYPE_RULES: Array<{ hints: string[]; types: string[] }> = [
  { hints: ["cafe", "cafes", "coffee"], types: ["cafe"] },
  { hints: ["restaurante", "restaurantes", "comida", "jantar", "almoco", "gastronomia", "lanche"], types: ["restaurant", "bakery", "bar"] },
  { hints: ["bar", "bares", "noite", "balada", "boate", "samba", "show", "karaoke", "lounge"], types: ["bar", "night_club"] },
  { hints: ["museu", "museus", "cultura", "cultural", "culturais", "historico", "historica", "historicos", "historicas", "historia"], types: ["museum", "art_gallery", "cultural_center"] },
  { hints: ["parque", "parques", "praia", "praias", "ao ar livre", "mirante", "trilha", "natureza"], types: ["park", "beach", "tourist_attraction", "viewpoint"] },
  { hints: ["atracao", "atracoes", "passeio", "passeios", "visitar", "turismo", "imperdiveis"], types: ["tourist_attraction", "museum", "park", "art_gallery"] },
  { hints: ["livro", "livraria", "biblioteca"], types: ["book_store", "library"] },
  { hints: ["cinema", "filme"], types: ["movie_theater"] },
  { hints: ["shopping", "compras", "mall"], types: ["shopping_mall"] },
  { hints: ["hotel", "hoteis", "motel", "pousada", "hostel", "hospedagem"], types: ["lodging"] },
  { hints: ["ubs", "upa", "posto de saude", "saude", "hospital", "clinica", "farmacia", "dentista", "laboratorio"], types: ["hospital", "doctor", "pharmacy", "health", "dentist"] },
  { hints: ["curso tecnico", "escola tecnica", "senai", "senac", "faculdade", "universidade", "escola", "colegio", "curso"], types: ["school", "university", "training_center"] },
  { hints: ["gasolina", "posto de gasolina", "combustivel", "gas"], types: ["gas_station"] },
  { hints: ["tapecaria", "estofaria", "ferragem", "autopecas", "oficina", "mecanica", "borracharia", "lava rapido"], types: ["home_goods_store", "hardware_store", "auto_parts_store", "car_repair"] },
  { hints: ["arena", "estadio", "ginasio", "quadra", "campo de futebol"], types: ["stadium", "sports_complex", "gym"] },
  { hints: ["estacionamento", "parking"], types: ["parking"] },
  { hints: ["terminal", "rodoviaria", "rodoviario", "bus station", "train station"], types: ["bus_station", "train_station"] },
];

const PROFILE_DEFAULT_TYPES: Record<CuratedProfile, string[]> = {
  home_curated: [
    "tourist_attraction",
    "museum",
    "park",
    "art_gallery",
    "cafe",
    "restaurant",
    "bakery",
    "bar",
    "book_store",
    "library",
    "movie_theater",
    "shopping_mall",
    "beach",
    "aquarium",
    "zoo",
    "cultural_center",
    "viewpoint",
    "church",
  ],
  chat_balanced: [
    "tourist_attraction",
    "museum",
    "park",
    "art_gallery",
    "cafe",
    "restaurant",
    "bakery",
    "bar",
    "book_store",
    "library",
    "movie_theater",
    "shopping_mall",
    "beach",
    "aquarium",
    "zoo",
    "cultural_center",
    "viewpoint",
    "church",
    "night_club",
    "bowling_alley",
    "spa",
    "casino",
  ],
  explicit_user_request: [
    "lodging",
    "hospital",
    "doctor",
    "pharmacy",
    "dentist",
    "health",
    "school",
    "university",
    "training_center",
    "bus_station",
    "train_station",
    "parking",
    "gas_station",
    "car_repair",
    "auto_parts_store",
    "hardware_store",
    "home_goods_store",
    "store",
    "supermarket",
    "convenience_store",
    "local_government_office",
    "city_hall",
    "event_venue",
    "stadium",
    "sports_complex",
    "gym",
    "bank",
    "atm",
    "travel_agency",
    "real_estate_agency",
    "tourist_attraction",
    "museum",
    "park",
    "art_gallery",
    "cafe",
    "restaurant",
    "bakery",
    "bar",
    "book_store",
    "library",
    "movie_theater",
    "shopping_mall",
    "beach",
    "aquarium",
    "zoo",
    "cultural_center",
    "viewpoint",
    "church",
    "night_club",
    "bowling_alley",
    "spa",
    "casino",
  ],
};

const isKnownType = (value: string) => {
  const normalized = normalizeText(value);
  return (
    CORE_TYPES.some((type) => normalizeText(type) === normalized) ||
    BALANCED_TYPES.some((type) => normalizeText(type) === normalized) ||
    DIRECT_RESTRICTED_TYPES.some((type) => normalizeText(type) === normalized) ||
    BLOCKED_TYPES.some((type) => normalizeText(type) === normalized)
  );
};

const getPlaceTypes = (place: NearbyPlace) => (Array.isArray(place.categories) ? place.categories : []).filter(Boolean);

export const inferCuratedProfile = (input: PlacesCurationInput): CuratedProfile => {
  const requestBlob = buildRequestBlob(input);
  const categories = input.categories || [];

  if (
    containsAnyHint(requestBlob, BLOCKED_HINTS) ||
    containsAnyHint(requestBlob, RESTRICTED_HINTS) ||
    intersectsTypes(categories, BLOCKED_TYPES) ||
    intersectsTypes(categories, RESTRICTED_TYPES)
  ) {
    return "explicit_user_request";
  }

  if (categories.length > 0) {
    if (containsAnyHint(requestBlob, BALANCED_HINTS) || containsAnyHint(requestBlob, ["night club"])) {
      return "chat_balanced";
    }
    return "home_curated";
  }

  if (!requestBlob || containsAnyHint(requestBlob, HOME_QUERY_HINTS)) {
    return "home_curated";
  }

  if (containsAnyHint(requestBlob, BALANCED_HINTS)) {
    return "chat_balanced";
  }

  return "chat_balanced";
};

export const inferRequestedGoogleTypes = (input: PlacesCurationInput) => {
  const requestBlob = buildRequestBlob(input);
  const categories = input.categories || [];
  const profile = inferCuratedProfile(input);
  const types = new Set<string>();

  for (const category of categories) {
    const normalizedCategory = normalizeText(category);
    if (isKnownType(normalizedCategory)) {
      types.add(normalizedCategory);
    }
  }

  for (const rule of REQUEST_TYPE_RULES) {
    if (containsAnyHint(requestBlob, rule.hints)) {
      rule.types.forEach((type) => types.add(type));
    }
  }

  if (types.size === 0) {
    PROFILE_DEFAULT_TYPES[profile].forEach((type) => types.add(type));
  }

  return [...types].slice(0, 12);
};

export const getVenueTier = (place: NearbyPlace): VenueTier => {
  const placeBlob = buildPlaceBlob(place);
  const types = getPlaceTypes(place);

  if (intersectsTypes(types, BLOCKED_TYPES) || containsAnyHint(placeBlob, BLOCKED_HINTS)) {
    return "blocked";
  }

  // Conditional: types that are OK only if the place is a landmark (high reviews + rating)
  if (intersectsTypes(types, CONDITIONAL_TYPES)) {
    return isLandmark(place) ? "conditional" : "restricted";
  }

  if (intersectsTypes(types, RESTRICTED_TYPES) || containsAnyHint(placeBlob, RESTRICTED_HINTS)) {
    return "restricted";
  }

  if (intersectsTypes(types, BALANCED_TYPES) || containsAnyHint(placeBlob, BALANCED_HINTS)) {
    return "balanced";
  }

  if (intersectsTypes(types, CORE_TYPES) || containsAnyHint(placeBlob, CORE_HINTS)) {
    return "core";
  }

  return "restricted";
};

export const isVenueAllowedForProfile = (place: NearbyPlace, profile: CuratedProfile) => {
  const tier = getVenueTier(place);
  if (tier === "blocked") return false;
  // Conditional landmarks are allowed in home and chat — they earned their spot via popularity
  if (profile === "home_curated") return tier === "core" || tier === "conditional";
  if (profile === "chat_balanced") return tier === "core" || tier === "balanced" || tier === "conditional";
  return true;
};

export const getProfileFallback = (profile: CuratedProfile): CuratedProfile | null => {
  if (profile === "home_curated") return "chat_balanced";
  return null;
};

export const countSharedMeaningfulTokens = (left: string, right: string) => {
  const stopwords = new Set([
    "de",
    "da",
    "do",
    "das",
    "dos",
    "em",
    "no",
    "na",
    "nos",
    "nas",
    "para",
    "por",
    "com",
    "e",
    "ou",
    "a",
    "o",
    "as",
    "os",
    "um",
    "uma",
    "uns",
    "umas",
    "perto",
    "voce",
    "mim",
    "aqui",
    "agora",
    "regiao",
    "lugares",
    "lugar",
    "opcoes",
    "opcao",
    "quero",
    "quais",
    "onde",
    "tem",
    "deve",
    "bacana",
    "legal",
    "boa",
    "bom",
    "ver",
    "fazer",
  ]);

  const tokenize = (value: string) =>
    normalizeText(value)
      .split(" ")
      .map((token) => token.trim())
      .filter((token) => token.length >= 4 && !stopwords.has(token));

  const leftTokens = new Set(tokenize(left));
  const rightTokens = tokenize(right);
  return rightTokens.reduce((score, token) => score + (leftTokens.has(token) ? 1 : 0), 0);
};
