type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();

const getFromCache = <T>(key: string): T | null => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
};

const setInCache = <T>(key: string, value: T, ttlMs: number) => {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
};

export const getNearbyCacheKey = (parts: Array<string | number | null | undefined>) =>
  parts.map((part) => String(part ?? "")).join("|");

export const nearbyCache = {
  get: <T>(key: string) => getFromCache<T>(key),
  set: <T>(key: string, value: T, ttlMs = 15 * 60 * 1000) => setInCache(key, value, ttlMs),
};
