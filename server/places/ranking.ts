import type { NearbyPlace } from "../ai/types";
import {
  buildPlaceBlob,
  buildRequestBlob,
  countSharedMeaningfulTokens,
  getProfileFallback,
  getVenueTier,
  inferCuratedProfile,
  isVenueAllowedForProfile,
  normalizeCurationText,
  type CuratedProfile,
  type PlacesCurationInput,
} from "./curation";

const CHAIN_HINTS = ["starbucks", "mcdonald", "burger king", "subway", "outback", "kfc", "habib", "bob's"];

const NIGHT_HINTS = ["noite", "night", "balada", "boate", "samba", "show", "karaoke", "lounge", "club"];
const FOOD_HINTS = ["cafe", "cafes", "coffee", "restaurante", "comida", "jantar", "almoco", "lanche", "padaria"];
const OUTDOOR_HINTS = ["parque", "praia", "ao ar livre", "mirante", "trilha", "natureza"];
const CULTURE_HINTS = ["cultura", "cultural", "museu", "arte", "historico", "historia"];
const TOURISM_HINTS = ["passeio", "passeios", "visitar", "turismo", "atracao", "atracoes", "imperdiveis"];

const NIGHT_TYPES = ["bar", "night_club", "bowling_alley", "casino"];
const FOOD_TYPES = ["cafe", "restaurant", "bakery", "bar"];
const OUTDOOR_TYPES = ["park", "beach", "tourist_attraction", "viewpoint"];
const CULTURE_TYPES = ["museum", "art_gallery", "cultural_center", "library", "book_store", "church"];
const TOURISM_TYPES = ["tourist_attraction", "museum", "park", "art_gallery", "shopping_mall", "beach", "aquarium", "zoo"];

const PROFILE_TIER_BONUS: Record<CuratedProfile, Record<"core" | "balanced" | "conditional" | "restricted" | "blocked", number>> = {
  home_curated: {
    core: 22,
    balanced: -30,
    conditional: 8, // Landmark fast-food/stores — allowed but ranked below true attractions
    restricted: -120,
    blocked: -1000,
  },
  chat_balanced: {
    core: 16,
    balanced: 22,
    conditional: 12,
    restricted: -120,
    blocked: -1000,
  },
  explicit_user_request: {
    core: 8,
    balanced: 8,
    conditional: 8,
    restricted: 24,
    blocked: -1000,
  },
};

type RankOptions = PlacesCurationInput & {
  mode?: "brasil" | "mundo" | null;
  curationProfile?: CuratedProfile;
};

const containsAnyHint = (blob: string, hints: string[]) => {
  if (!blob) return false;
  const padded = ` ${blob} `;
  return hints.some((hint) => {
    const normalizedHint = normalizeCurationText(hint);
    if (!normalizedHint) return false;
    return padded.includes(` ${normalizedHint} `);
  });
};

const hasAnyType = (types: string[], candidates: string[]) => {
  if (types.length === 0 || candidates.length === 0) return false;
  const normalizedTypes = new Set(types.map(normalizeCurationText));
  return candidates.some((candidate) => normalizedTypes.has(normalizeCurationText(candidate)));
};

const dedupePlaces = (places: NearbyPlace[]) => {
  const seen = new Set<string>();
  return places.filter((place) => {
    const key = place.placeId || `${place.name}|${place.address}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const scorePlace = (place: NearbyPlace, options: RankOptions, profile: CuratedProfile) => {
  const requestBlob = buildRequestBlob(options);
  const placeBlob = buildPlaceBlob(place);
  const tier = getVenueTier(place);

  let score = 0;
  score += PROFILE_TIER_BONUS[profile][tier];
  score += place.distanceMeters == null ? 10 : Math.max(0, 120 - Math.min(place.distanceMeters / 25, 120));
  score += (place.rating || 0) * 12;
  score += Math.min((place.userRatingsTotal || 0) / 40, 20);

  if (place.isOpenNow === true) score += 12;
  if (place.isOpenNow === false) score -= 8;
  if (place.photoUrl) score += 6;

  const tokenOverlap = countSharedMeaningfulTokens(requestBlob, placeBlob);
  score += Math.min(tokenOverlap * (profile === "explicit_user_request" ? 4 : 2), profile === "explicit_user_request" ? 16 : 10);

  if (containsAnyHint(requestBlob, NIGHT_HINTS) && hasAnyType(place.categories, NIGHT_TYPES)) score += 16;
  if (containsAnyHint(requestBlob, FOOD_HINTS) && hasAnyType(place.categories, FOOD_TYPES)) score += 12;
  if (containsAnyHint(requestBlob, OUTDOOR_HINTS) && hasAnyType(place.categories, OUTDOOR_TYPES)) score += 12;
  if (containsAnyHint(requestBlob, CULTURE_HINTS) && hasAnyType(place.categories, CULTURE_TYPES)) score += 12;
  if (containsAnyHint(requestBlob, TOURISM_HINTS) && hasAnyType(place.categories, TOURISM_TYPES)) score += 10;

  if (profile === "explicit_user_request" && tier === "restricted" && requestBlob) {
    score += 10;
  }

  if (options.mode === "brasil" && CHAIN_HINTS.some((hint) => normalizeCurationText(place.name).includes(normalizeCurationText(hint)))) {
    score -= 25;
  }

  return score;
};

const rankForProfile = (places: NearbyPlace[], options: RankOptions, profile: CuratedProfile) => {
  return dedupePlaces(places)
    .filter((place) => isVenueAllowedForProfile(place, profile))
    .map((place) => ({ place, score: scorePlace(place, options, profile) }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.place);
};

export const rankNearbyPlaces = (places: NearbyPlace[], options?: RankOptions) => {
  const profile = options?.curationProfile || inferCuratedProfile(options || {});
  const ranked = rankForProfile(places, options || {}, profile);

  if (ranked.length === 0) {
    const fallbackProfile = getProfileFallback(profile);
    if (fallbackProfile) {
      return rankForProfile(places, options || {}, fallbackProfile);
    }
  }

  return ranked;
};
