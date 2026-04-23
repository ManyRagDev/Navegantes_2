import type { IntentName, NearbyPlace, SafetyProfile } from "./types";

type CurationSurface = "home" | "chat" | "itinerary" | "story";

type CurateNearbyPlacesOptions = {
  surface?: CurationSurface;
  intent?: IntentName | null;
  query?: string | null;
  safetyProfile?: SafetyProfile;
  requestedCount?: number | null;
};

type CuratedNearbyPlacesResult = {
  items: NearbyPlace[];
  droppedCount: number;
  surface: CurationSurface;
  safetyProfile: SafetyProfile;
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const hasAny = (text: string, terms: string[]) => terms.some((term) => text.includes(term));

const QUERY_THEME_RULES: Array<{ theme: string; terms: string[] }> = [
  { theme: "nightlife", terms: ["noite", "balada", "bar", "samba", "forro", "show", "curtir", "role"] },
  { theme: "food", terms: ["comer", "restaurante", "cafe", "cafeteria", "padaria", "almoco", "janta", "lanche"] },
  { theme: "culture", terms: ["museu", "cultural", "historia", "historico", "arte", "bairro", "regiao", "tradicao"] },
  { theme: "outdoor", terms: ["parque", "praia", "trilha", "mirante", "ao ar livre", "natureza"] },
  { theme: "shopping", terms: ["shopping", "feira", "mercado", "livraria", "compras"] },
  { theme: "lodging", terms: ["motel", "hotel", "hospedagem", "onde ficar", "pernoite"] },
  { theme: "health", terms: ["ubs", "posto de saude", "farmacia", "clinica", "hospital", "medico"] },
  { theme: "utility", terms: ["tapecaria", "autopec", "oficina", "borrachar", "gas", "arena", "estadio", "escola"] },
];

const THEME_BY_TYPE: Record<string, string> = {
  tourist_attraction: "culture",
  museum: "culture",
  art_gallery: "culture",
  cultural_center: "culture",
  park: "outdoor",
  beach: "outdoor",
  natural_feature: "outdoor",
  restaurant: "food",
  cafe: "food",
  bakery: "food",
  bar: "nightlife",
  night_club: "nightlife",
  meal_takeaway: "food",
  meal_delivery: "food",
  store: "shopping",
  shopping_mall: "shopping",
  book_store: "shopping",
  lodging: "lodging",
  hotel: "lodging",
  motel: "lodging",
  hospital: "health",
  doctor: "health",
  pharmacy: "health",
  school: "utility",
  university: "utility",
  gas_station: "utility",
  car_repair: "utility",
  real_estate_agency: "utility",
  finance: "utility",
  government_office: "utility",
  sports_complex: "utility",
  stadium: "utility",
  gym: "utility",
  airport: "utility",
  transit_station: "utility",
};

const HOME_ALLOWED_THEMES = new Set(["culture", "outdoor", "food", "nightlife", "shopping"]);
const CHAT_ALLOWED_THEMES = new Set(["culture", "outdoor", "food", "nightlife", "shopping"]);
const ITINERARY_ALLOWED_THEMES = new Set(["culture", "outdoor", "food", "nightlife", "shopping"]);
const STORY_ALLOWED_THEMES = new Set(["culture", "outdoor", "food", "nightlife"]);

const EXPLICIT_ALLOW_RULES: Array<{ terms: string[]; themes: string[] }> = [
  { terms: ["motel", "hotel", "hospedagem", "onde ficar", "pernoite"], themes: ["lodging"] },
  { terms: ["ubs", "posto de saude", "farmacia", "clinica", "hospital", "medico"], themes: ["health"] },
  { terms: ["tapecaria", "autopec", "oficina", "borrachar", "gas", "ferragem"], themes: ["utility"] },
  { terms: ["arena", "estadio", "futebol", "esporte", "jogo"], themes: ["utility"] },
  { terms: ["escola", "curso", "treinamento", "faculdade"], themes: ["utility"] },
];

const GENERIC_TYPES = new Set(["point_of_interest", "establishment", "premise"]);
const BLOCKED_NAME_HINTS = ["motel", "ubs", "hospital", "clinica", "posto de saude", "tapecaria", "autopec", "oficina"];

const inferThemeFromQuery = (query: string | null | undefined) => {
  const normalized = normalizeText(query || "");
  for (const rule of QUERY_THEME_RULES) {
    if (hasAny(normalized, rule.terms)) return rule.theme;
  }
  return null;
};

const inferThemesFromTypes = (types: string[]) => {
  const themes = new Set<string>();
  for (const type of types) {
    const theme = THEME_BY_TYPE[type];
    if (theme) themes.add(theme);
  }
  return themes;
};

const inferThemeForPlace = (place: NearbyPlace) => {
  const themes = inferThemesFromTypes(place.categories.map((value) => normalizeText(value)));
  const text = normalizeText([place.name, place.address, place.description].filter(Boolean).join(" "));
  for (const rule of QUERY_THEME_RULES) {
    if (hasAny(text, rule.terms)) themes.add(rule.theme);
  }
  return themes;
};

const explicitThemesForQuery = (query: string | null | undefined) => {
  const normalized = normalizeText(query || "");
  const allowed = new Set<string>();
  for (const rule of EXPLICIT_ALLOW_RULES) {
    if (hasAny(normalized, rule.terms)) {
      for (const theme of rule.themes) allowed.add(theme);
    }
  }
  return allowed;
};

const detectSurface = (options: CurateNearbyPlacesOptions) => {
  if (options.surface) return options.surface;
  const theme = inferThemeFromQuery(options.query);
  const normalizedQuery = normalizeText(options.query || "");
  const genericDiscovery = /\b(lugares|pontos turisticos|pontos turisticos|o que fazer|o que visitar|lugares interessantes|atracoes|atracoes|perto de voce|perto|visitar)\b/.test(
    normalizedQuery,
  );
  if (theme === "lodging" || theme === "health" || theme === "utility") return "chat";
  if (theme) return "home";
  if (genericDiscovery) return "home";
  return options.intent === "itinerary_planning" ? "itinerary" : "chat";
};

const allowedThemesForSurface = (surface: CurationSurface) => {
  if (surface === "home") return HOME_ALLOWED_THEMES;
  if (surface === "itinerary") return ITINERARY_ALLOWED_THEMES;
  if (surface === "story") return STORY_ALLOWED_THEMES;
  return CHAT_ALLOWED_THEMES;
};

const scorePlace = (place: NearbyPlace, options: CurateNearbyPlacesOptions, surface: CurationSurface) => {
  const safetyProfile = options.safetyProfile || "equilibrado";
  const queryTheme = inferThemeFromQuery(options.query);
  const explicitThemes = explicitThemesForQuery(options.query);
  const placeThemes = inferThemeForPlace(place);
  const normalizedText = normalizeText([place.name, place.address, place.description].filter(Boolean).join(" "));

  let score = 0;
  const distanceScore = place.distanceMeters == null ? 10 : Math.max(0, 110 - Math.min(place.distanceMeters / 30, 110));
  score += distanceScore;

  const rating = place.rating || 0;
  const reviews = place.userRatingsTotal || 0;
  score += rating * 13;
  score += Math.min(reviews / 45, 18);

  if (place.isOpenNow) score += 10;
  if (place.photoUrl) score += 5;

  if (surface === "home") {
    if (placeThemes.has("culture") || placeThemes.has("outdoor") || placeThemes.has("food") || placeThemes.has("nightlife")) {
      score += 12;
    }
    if (placeThemes.has("utility") || placeThemes.has("health") || placeThemes.has("lodging")) {
      score -= 22;
    }
  }

  if (surface === "itinerary") {
    if (placeThemes.has("culture") || placeThemes.has("outdoor") || placeThemes.has("food")) score += 14;
    if (placeThemes.has("lodging")) score -= 6;
  }

  if (queryTheme) {
    if (placeThemes.has(queryTheme)) score += 18;
    else if (queryTheme === "nightlife" && placeThemes.has("food")) score += 6;
    else if (queryTheme === "food" && placeThemes.has("nightlife")) score += 4;
    else score -= 4;
  }

  if (explicitThemes.size > 0) {
    const matchedExplicitTheme = [...explicitThemes].some((theme) => placeThemes.has(theme));
    score += matchedExplicitTheme ? 20 : -8;
  }

  if (safetyProfile === "priorizar_seguranca") {
    if (rating < 4) score -= 16;
    if (reviews < 20) score -= 10;
    if (!place.isOpenNow) score -= 8;
    if (!place.photoUrl) score -= 4;
    if (place.distanceMeters != null && place.distanceMeters > 3500) score -= 6;
  } else {
    if (rating < 3.2 && reviews < 10) score -= 6;
  }

  if (normalizedText.includes("arena") && surface === "home" && !explicitThemes.has("utility")) {
    score -= 25;
  }

  if (BLOCKED_NAME_HINTS.some((hint) => normalizedText.includes(hint)) && explicitThemes.size === 0) {
    score -= 30;
  }

  return score;
};

const shouldKeepPlace = (place: NearbyPlace, options: CurateNearbyPlacesOptions, surface: CurationSurface) => {
  const safetyProfile = options.safetyProfile || "equilibrado";
  const normalizedText = normalizeText([place.name, place.address, place.description].filter(Boolean).join(" "));
  const placeTypes = place.categories.map((value) => normalizeText(value)).filter((value) => !GENERIC_TYPES.has(value));
  const placeThemes = inferThemeForPlace(place);
  const allowedThemes = allowedThemesForSurface(surface);
  const explicitThemes = explicitThemesForQuery(options.query);
  const queryTheme = inferThemeFromQuery(options.query);

  if (BLOCKED_NAME_HINTS.some((hint) => normalizedText.includes(hint)) && explicitThemes.size === 0) {
    return false;
  }

  if (placeTypes.length === 0 && placeThemes.size === 0) {
    return surface !== "home";
  }

  const hasAllowedTheme = [...placeThemes].some((theme) => allowedThemes.has(theme));
  const hasExplicitTheme = [...placeThemes].some((theme) => explicitThemes.has(theme));
  const looksUseful = hasAllowedTheme || hasExplicitTheme || (queryTheme != null && placeThemes.has(queryTheme));

  if (surface === "home") {
    if (!looksUseful) return false;
    if (placeThemes.has("utility") || placeThemes.has("health")) return false;
  }

  if (surface === "itinerary") {
    if (placeThemes.has("utility") || placeThemes.has("health")) return false;
  }

  if (safetyProfile === "priorizar_seguranca") {
    if ((place.rating ?? 0) > 0 && place.rating! < 3.4 && (place.userRatingsTotal ?? 0) < 15) return false;
    if (place.isOpenNow === false && (place.userRatingsTotal ?? 0) < 30) return false;
  }

  return looksUseful || surface !== "home";
};

export const curateNearbyPlaces = (
  places: NearbyPlace[],
  options: CurateNearbyPlacesOptions = {},
): CuratedNearbyPlacesResult => {
  const surface = detectSurface(options);
  const sorted = [...places]
    .filter((place) => shouldKeepPlace(place, options, surface))
    .map((place) => ({ place, score: scorePlace(place, options, surface) }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.place);

  const limit = options.requestedCount ? Math.max(1, Math.min(Math.floor(options.requestedCount), 10)) : surface === "home" ? 10 : 8;
  return {
    items: sorted.slice(0, limit),
    droppedCount: Math.max(0, places.length - sorted.length),
    surface,
    safetyProfile: options.safetyProfile || "equilibrado",
  };
};

export const inferCurationSurface = detectSurface;
