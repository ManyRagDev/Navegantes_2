import { getNearbyCacheKey, nearbyCache } from "../cache/nearbyCache";
import type { NearbyPlace } from "../ai/types";
import { buildRequestBlob, inferCuratedProfile, inferRequestedGoogleTypes, normalizeCurationText, type PlacesCurationInput } from "./curation";
import { rankNearbyPlaces } from "./ranking";

type PlacesSearchInput = PlacesCurationInput & {
  lat?: number | null;
  lng?: number | null;
  radiusMeters?: number;
};

const getGoogleApiKey = () =>
  process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

const haversineDistanceMeters = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const createPhotoUrl = (photoName: string) => {
  const apiKey = getGoogleApiKey();
  if (!apiKey || !photoName) return "";
  return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&key=${apiKey}`;
};

const normalizePlace = (place: any, input: PlacesSearchInput): NearbyPlace => {
  const latitude = place.location?.latitude ?? 0;
  const longitude = place.location?.longitude ?? 0;
  const types = Array.isArray(place.types) ? place.types : [];
  const primary = place.primaryTypeDisplayName?.text || place.displayName?.text || "Local";
  return {
    placeId: place.id || place.name || primary,
    name: place.displayName?.text || primary,
    address: place.formattedAddress || place.shortFormattedAddress || "",
    latitude,
    longitude,
    distanceMeters:
      input.lat != null && input.lng != null
        ? haversineDistanceMeters(input.lat, input.lng, latitude, longitude)
        : null,
    rating: typeof place.rating === "number" ? place.rating : null,
    userRatingsTotal: typeof place.userRatingCount === "number" ? place.userRatingCount : null,
    photoUrl: createPhotoUrl(place.photos?.[0]?.name || ""),
    categories: types,
    isOpenNow: typeof place.currentOpeningHours?.openNow === "boolean" ? place.currentOpeningHours.openNow : null,
    icon: types.includes("park")
      ? "🌿"
      : types.includes("museum")
        ? "🏛️"
        : types.includes("tourist_attraction")
          ? "🗺️"
          : types.includes("restaurant")
            ? "🍽️"
            : types.includes("cafe")
              ? "☕"
              : "📍",
    description: buildPlaceDescription(place),
  };
};

const buildPlaceDescription = (place: any) => {
  const rating = typeof place.rating === "number" ? `Nota ${place.rating.toFixed(1)}` : "Sem nota";
  const reviews = typeof place.userRatingCount === "number" ? `${place.userRatingCount} avaliacoes` : "poucas avaliacoes";
  return `${rating} • ${reviews}`;
};

const fieldMask =
  "places.id,places.name,places.displayName,places.formattedAddress,places.shortFormattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.primaryTypeDisplayName,places.photos,places.currentOpeningHours.openNow";

const fetchPlaces = async (url: string, body: Record<string, unknown>) => {
  const apiKey = getGoogleApiKey();
  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY/GOOGLE_MAPS_API_KEY nao configurada no servidor");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `Falha do Google Places (${response.status})`);
  }

  return Array.isArray(data.places) ? data.places : [];
};

export const searchNearbyPlaces = async (input: PlacesSearchInput): Promise<NearbyPlace[]> => {
  if (input.lat == null || input.lng == null) {
    throw new Error("Latitude e longitude sao obrigatorias para nearby search");
  }

  const curationProfile = inferCuratedProfile(input);
  const includedTypes = inferRequestedGoogleTypes(input);
  const requestBlob = buildRequestBlob(input);
  const cacheKey = getNearbyCacheKey([
    "nearby",
    curationProfile,
    input.lat.toFixed(3),
    input.lng.toFixed(3),
    input.radiusMeters || 1800,
    includedTypes.join(","),
    requestBlob,
    input.mode,
    normalizeCurationText(input.moment || ""),
  ]);
  const cached = nearbyCache.get<NearbyPlace[]>(cacheKey);
  if (cached) return cached;

  const places = await fetchPlaces("https://places.googleapis.com/v1/places:searchNearby", {
    includedTypes: includedTypes.length > 0 ? includedTypes : undefined,
    maxResultCount: 20,
    languageCode: "pt-BR",
    locationRestriction: {
      circle: {
        center: {
          latitude: input.lat,
          longitude: input.lng,
        },
        radius: Math.min(input.radiusMeters || 1800, 50000),
      },
    },
  });

  const normalized = rankNearbyPlaces(
    places.map((place) => normalizePlace(place, input)),
    { mode: input.mode, placeQuery: input.placeQuery, categories: input.categories, moment: input.moment, city: input.city, curationProfile },
  );
  nearbyCache.set(cacheKey, normalized, 20 * 60 * 1000);
  return normalized;
};

export const searchPlacesByText = async (input: PlacesSearchInput): Promise<NearbyPlace[]> => {
  const query = [input.placeQuery, input.city].filter(Boolean).join(" em ").trim();
  if (!query) {
    throw new Error("Texto de busca ausente para text search");
  }

  const curationProfile = inferCuratedProfile(input);
  const requestBlob = buildRequestBlob(input);
  const cacheKey = getNearbyCacheKey([
    "text-search",
    query,
    requestBlob,
    curationProfile,
    input.lat?.toFixed(2),
    input.lng?.toFixed(2),
    input.mode,
    normalizeCurationText(input.moment || ""),
  ]);
  const cached = nearbyCache.get<NearbyPlace[]>(cacheKey);
  if (cached) return cached;

  const places = await fetchPlaces("https://places.googleapis.com/v1/places:searchText", {
    textQuery: query,
    maxResultCount: 20,
    languageCode: "pt-BR",
    locationBias:
      input.lat != null && input.lng != null
        ? {
            circle: {
              center: {
                latitude: input.lat,
                longitude: input.lng,
              },
              radius: 12000,
            },
          }
        : undefined,
  });

  const normalized = rankNearbyPlaces(
    places.map((place) => normalizePlace(place, input)),
    { mode: input.mode, placeQuery: input.placeQuery || input.city || "", categories: input.categories, moment: input.moment, city: input.city, curationProfile },
  );
  nearbyCache.set(cacheKey, normalized, 20 * 60 * 1000);
  return normalized;
};
