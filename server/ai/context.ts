import type { AIChatContext, ConversationMemory, IntentClassification } from "./types";
import { extractCategoryHint, extractRegionHint, extractRequestedCount, inferSafetyProfile } from "./intents";

const MEMORY_TTL_MS = 15 * 60 * 1000;
const MEMORY_MAX_ENTRIES = 200;

type MemoryEntry = {
  state: ConversationMemory;
  updatedAt: number;
};

const memoryStore = new Map<string, MemoryEntry>();

const normalizeKeyPart = (value: string | null | undefined) => (value ? value.toLowerCase().trim() : "");

const snapCoord = (value?: number | null) => {
  if (value == null || !Number.isFinite(value)) return "";
  return value.toFixed(2);
};

const resolveConversationKeys = (context: AIChatContext = {}) => {
  const keys: string[] = [];
  if (context.conversationId) keys.push(`conversation:${normalizeKeyPart(context.conversationId)}`);

  const selectedPlaceKey = [
    normalizeKeyPart(context.selectedPlaceId),
    normalizeKeyPart(context.selectedPlaceName),
    normalizeKeyPart(context.userCity),
  ]
    .filter(Boolean)
    .join("|");
  if (selectedPlaceKey) keys.push(`selected:${selectedPlaceKey}`);

  const geoKey = [snapCoord(context.lat), snapCoord(context.lng), normalizeKeyPart(context.userCity)]
    .filter(Boolean)
    .join("|");
  if (geoKey) keys.push(`geo:${geoKey}`);

  const cityKey = normalizeKeyPart(context.userCity);
  if (cityKey) keys.push(`city:${cityKey}`);

  return [...new Set(keys)];
};

const defaultMemory = (): ConversationMemory => ({
  lastIntent: null,
  lastRegion: null,
  lastCategory: null,
  lastRequestedCount: null,
  safetyProfile: "equilibrado",
  updatedAt: Date.now(),
});

const pruneMemoryStore = () => {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (now - entry.updatedAt > MEMORY_TTL_MS) {
      memoryStore.delete(key);
    }
  }

  if (memoryStore.size <= MEMORY_MAX_ENTRIES) return;

  const entries = [...memoryStore.entries()].sort((a, b) => a[1].updatedAt - b[1].updatedAt);
  while (entries.length > MEMORY_MAX_ENTRIES) {
    const [key] = entries.shift() || [];
    if (key) memoryStore.delete(key);
  }
};

export const getConversationMemory = (context: AIChatContext = {}): ConversationMemory | null => {
  pruneMemoryStore();
  for (const key of resolveConversationKeys(context)) {
    const entry = memoryStore.get(key);
    if (entry) return entry.state;
  }
  return null;
};

export const mergeContextWithMemory = (context: AIChatContext = {}, memory: ConversationMemory | null = null): AIChatContext => {
  if (!memory) return context;

  return {
    ...context,
    recentIntent: context.recentIntent || memory.lastIntent,
    recentRegion: context.recentRegion || memory.lastRegion,
    recentCategory: context.recentCategory || memory.lastCategory,
    requestedCount: context.requestedCount ?? memory.lastRequestedCount ?? extractRequestedCount("", context),
    safetyProfile: context.safetyProfile || memory.safetyProfile || inferSafetyProfile("", context),
  };
};

export const rememberConversationState = (context: AIChatContext = {}, patch: Partial<ConversationMemory>) => {
  const keys = resolveConversationKeys(context);
  if (keys.length === 0) return null;

  const currentMemory = getConversationMemory(context) || defaultMemory();
  const nextState: ConversationMemory = {
    ...currentMemory,
    ...patch,
    safetyProfile: patch.safetyProfile || currentMemory.safetyProfile || "equilibrado",
    updatedAt: Date.now(),
  };

  for (const key of keys) {
    memoryStore.set(key, { state: nextState, updatedAt: nextState.updatedAt });
  }

  pruneMemoryStore();
  return nextState;
};

export const rememberConversationFromClassification = (
  message: string,
  context: AIChatContext,
  classification: IntentClassification,
) => {
  const patch: Partial<ConversationMemory> = {
    lastIntent: classification.intent,
    lastRegion: classification.regionHint || extractRegionHint(message, context),
    lastCategory: classification.categoryHint || extractCategoryHint(message, context),
    lastRequestedCount: classification.requestedCount ?? extractRequestedCount(message, context),
    safetyProfile: classification.safetyProfile || inferSafetyProfile(message, context),
  };

  return rememberConversationState(context, patch);
};

export const summarizeConversationMemory = (memory: ConversationMemory | null) => {
  if (!memory) return "sem memoria recente";
  return [
    memory.lastIntent ? `intent=${memory.lastIntent}` : null,
    memory.lastRegion ? `regiao=${memory.lastRegion}` : null,
    memory.lastCategory ? `categoria=${memory.lastCategory}` : null,
    memory.lastRequestedCount ? `quantidade=${memory.lastRequestedCount}` : null,
    `seguranca=${memory.safetyProfile}`,
  ]
    .filter(Boolean)
    .join(" | ");
};
