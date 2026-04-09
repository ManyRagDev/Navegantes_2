import type { NearbyPlace } from "../ai/types";

const CHAIN_HINTS = [
  "starbucks",
  "mcdonald",
  "burger king",
  "subway",
  "outback",
  "kfc",
  "habib",
  "bob's",
];

const startsOutdoor = (query: string) => /\b(parque|praia|trilha|ao ar livre|mirante)\b/i.test(query);
const startsFood = (query: string) => /\b(caf[eé]|restaurante|bar|comida|padaria)\b/i.test(query);

export const rankNearbyPlaces = (
  places: NearbyPlace[],
  options?: { mode?: "brasil" | "mundo" | null; placeQuery?: string | null },
) => {
  const query = options?.placeQuery || "";
  return [...places]
    .map((place) => {
      let score = 0;
      const distanceScore =
        place.distanceMeters == null ? 10 : Math.max(0, 120 - Math.min(place.distanceMeters / 25, 120));
      score += distanceScore;
      score += (place.rating || 0) * 12;
      score += Math.min((place.userRatingsTotal || 0) / 40, 20);
      if (place.isOpenNow) score += 12;
      if (place.photoUrl) score += 6;
      if (options?.mode === "brasil" && CHAIN_HINTS.some((hint) => place.name.toLowerCase().includes(hint))) {
        score -= 25;
      }
      if (startsOutdoor(query) && place.categories.some((category) => ["park", "beach", "tourist_attraction"].includes(category))) {
        score += 18;
      }
      if (startsFood(query) && place.categories.some((category) => ["cafe", "restaurant", "bakery", "bar"].includes(category))) {
        score += 18;
      }
      return { place, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.place);
};
