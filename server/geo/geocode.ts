import { getNearbyCacheKey, nearbyCache } from "../cache/nearbyCache";

export type ReverseGeocodeResult = {
  city: string;
  stateOrRegion: string;
  country: string;
  formattedLocation: string;
};

const getGoogleApiKey = () =>
  process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

export const reverseGeocode = async (latitude: number, longitude: number): Promise<ReverseGeocodeResult> => {
  const cacheKey = getNearbyCacheKey(["reverse-geocode", latitude.toFixed(3), longitude.toFixed(3)]);
  const cached = nearbyCache.get<ReverseGeocodeResult>(cacheKey);
  if (cached) return cached;

  const apiKey = getGoogleApiKey();
  if (!apiKey) {
    return {
      city: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
      stateOrRegion: "",
      country: "",
      formattedLocation: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
    };
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&language=pt-BR&key=${apiKey}`,
  );
  const data = await response.json();
  if (!response.ok || data.status !== "OK") {
    throw new Error(data?.error_message || `Falha no reverse geocode (${response.status})`);
  }

  const components = data.results?.[0]?.address_components || [];
  const readComponent = (type: string) =>
    components.find((component: any) => Array.isArray(component.types) && component.types.includes(type))?.long_name || "";

  const city = readComponent("locality") || readComponent("administrative_area_level_2") || readComponent("sublocality");
  const stateOrRegion = readComponent("administrative_area_level_1");
  const country = readComponent("country");
  const formattedLocation = [city, stateOrRegion || country].filter(Boolean).join(", ") || data.results?.[0]?.formatted_address;

  const result = {
    city,
    stateOrRegion,
    country,
    formattedLocation,
  };

  nearbyCache.set(cacheKey, result, 6 * 60 * 60 * 1000);
  return result;
};
