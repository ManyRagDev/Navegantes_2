import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { readFile } from "node:fs/promises";
import cors from "cors";
import dotenv from "dotenv";
import { reverseGeocode } from "./server/geo/geocode";
import { buildCaptainGreeting, classifyAIIntent, getNearbySuggestions, routeAIChat } from "./server/ai/router";
import { callPollinations } from "./server/ai/providers/pollinations";
import type { AIChatRouteRequest, AIProvider, ChatMessage, NearbyPlace } from "./server/ai/types";
import {
  addFavorite,
  checkDatabaseHealth,
  createPost,
  createSeal,
  getPosts,
  getProfile,
  likePost,
  removeFavorite,
  updateProfile,
  upgradeProfile,
} from "./serverData";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

type AIRequest =
  | {
      operation:
        | "captain_chat"
        | "captain_greeting"
        | "city_lookup"
        | "quick_suggestions"
        | "dashboard_suggestions"
        | "itinerary_suggestions";
      input?: Record<string, unknown>;
    }
  | {
      model?: string;
      messages?: ChatMessage[];
      responseMimeType?: string;
    };

type AISuccessResponse = {
  ok: true;
  type: "text" | "structured";
  provider: AIProvider;
  model: string;
  text: string;
  data: unknown;
  raw?: unknown;
};

type AIErrorResponse = {
  ok: false;
  error: string;
  provider?: AIProvider;
  model?: string;
  details?: unknown;
};

const resolveProvider = (): AIProvider => {
  const envProvider = (process.env.AI_PROVIDER || "pollinations").toLowerCase();
  if (envProvider === "gemini") return "gemini";
  if (envProvider === "groq") return "groq";
  return "pollinations";
};

const safeString = (value: unknown, fallback = "") => {
  return typeof value === "string" ? value : fallback;
};

const asFiniteNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const stripCodeFences = (value: string) => {
  return value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
};

const tryParseJson = (value: string) => {
  try {
    return JSON.parse(stripCodeFences(value));
  } catch {
    return null;
  }
};

const mapNearbyPlaceToLegacyListItem = (place: NearbyPlace, index: number) => ({
  id: place.placeId || index + 1,
  title: place.name,
  description: place.address || place.description || "Sem descricao disponivel.",
  time: `${9 + index * 2}:00`,
  icon: place.icon || "🧭",
  rating: place.rating ?? undefined,
  img: place.photoUrl || "",
});

const inferQuickSuggestionQuery = (weather: string) => {
  const normalized = weather.toLowerCase();
  if (/\b(chuva|chuvisco|tempestade)\b/.test(normalized)) return "cafes e museus";
  if (/\b(sol|ensolarado|calor)\b/.test(normalized)) return "parques e atracoes ao ar livre";
  return "lugares interessantes";
};

const callGemini = async (messages: ChatMessage[], responseType: "text" | "structured", model?: string) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY nao configurada no servidor");
  }

  const selectedModel = model || process.env.AI_TEXT_MODEL || "gemini-3-flash-preview";
  const contents = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));

  const systemInstruction = messages.find((message) => message.role === "system")?.content;

  const body: Record<string, unknown> = {
    contents,
    generationConfig: responseType === "structured" ? { responseMimeType: "application/json" } : undefined,
    systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  const data = await response.json();
  if (!response.ok) {
    const errorMessage =
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof (data as any)?.error?.message === "string"
        ? (data as any).error.message
        : `Falha do provedor Gemini (${response.status})`;
    throw new Error(errorMessage);
  }

  return {
    provider: "gemini" as const,
    model: selectedModel,
    text: safeString((data as any)?.candidates?.[0]?.content?.parts?.[0]?.text),
    raw: data,
  };
};

const invokeLegacyProvider = async (messages: ChatMessage[], responseType: "text" | "structured", model?: string) => {
  const provider = resolveProvider();
  return provider === "gemini"
    ? callGemini(messages, responseType, model)
    : callPollinations(messages, responseType, model);
};

const toAIResponse = async (
  operation:
    | "captain_chat"
    | "captain_greeting"
    | "city_lookup"
    | "quick_suggestions"
    | "dashboard_suggestions"
    | "itinerary_suggestions",
  input: Record<string, unknown> = {},
): Promise<AISuccessResponse> => {
  if (operation === "city_lookup") {
    const latitude = asFiniteNumber(input.latitude) ?? 0;
    const longitude = asFiniteNumber(input.longitude) ?? 0;
    const geo = await reverseGeocode(latitude, longitude);
    return {
      ok: true,
      type: "structured",
      provider: "groq",
      model: "google-geocode",
      text: geo.formattedLocation,
      data: { city: geo.formattedLocation },
      raw: geo,
    };
  }

  if (operation === "captain_greeting") {
    const text = await buildCaptainGreeting({
      userCity: safeString(input.location, "coordenadas interessantes"),
      mode: safeString(input.mode) === "mundo" ? "mundo" : "brasil",
    });
    return {
      ok: true,
      type: "text",
      provider: "groq",
      model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
      text,
      data: null,
    };
  }

  if (operation === "captain_chat") {
    const routed = await routeAIChat(safeString(input.userText), {
      mode: safeString(input.mode) === "o Mundo" || safeString(input.mode) === "mundo" ? "mundo" : "brasil",
      userCity: safeString(input.userCity) || null,
      lat: asFiniteNumber(input.latitude),
      lng: asFiniteNumber(input.longitude),
      selectedPlaceName: safeString(input.selectedPlaceName) || null,
      selectedPlaceAddress: safeString(input.selectedPlaceAddress) || null,
    });
    return {
      ok: true,
      type: routed.data?.items ? "structured" : "text",
      provider: routed.executor.includes("pollinations") ? "pollinations" : "groq",
      model: routed.executor.includes("pollinations")
        ? process.env.AI_TEXT_MODEL || "openai"
        : process.env.GROQ_MODEL || "openai/gpt-oss-20b",
      text: routed.text,
      data: routed.data,
      raw: routed.trace,
    };
  }

  if (operation === "quick_suggestions" || operation === "dashboard_suggestions") {
    const items = await getNearbySuggestions({
      lat: asFiniteNumber(input.latitude),
      lng: asFiniteNumber(input.longitude),
      city: safeString(input.city) || null,
      mode: safeString(input.mode) === "mundo" ? "mundo" : "brasil",
      placeQuery:
        operation === "quick_suggestions"
          ? inferQuickSuggestionQuery(safeString(input.weather))
          : safeString(input.placeQuery) || "lugares para visitar",
      radiusMeters: operation === "quick_suggestions" ? 1800 : 5000,
    });

    const normalizedItems = items
      .slice(0, operation === "quick_suggestions" ? 3 : 10)
      .map((item, index) => mapNearbyPlaceToLegacyListItem(item, index));

    return {
      ok: true,
      type: "structured",
      provider: "groq",
      model: "google-places",
      text: JSON.stringify(normalizedItems),
      data: { items: normalizedItems },
      raw: { source: "google_places" },
    };
  }

  if (operation === "itinerary_suggestions") {
    const items = await getNearbySuggestions({
      city: safeString(input.destination) || null,
      placeQuery: "pontos turisticos imperdiveis",
      mode: safeString(input.mode) === "mundo" ? "mundo" : "brasil",
    });
    const normalizedItems = items.slice(0, 5).map((item, index) => ({
      id: index + 1,
      title: item.name,
      description: item.address || item.description,
      time: `${9 + index * 2}:00`,
    }));
    return {
      ok: true,
      type: "structured",
      provider: "groq",
      model: "google-places",
      text: JSON.stringify(normalizedItems),
      data: { items: normalizedItems },
      raw: { source: "google_places" },
    };
  }

  return {
    ok: true,
    type: "structured",
    provider: "groq",
    model: "fallback",
    text: "[]",
    data: { items: [] },
  };
};

const sendAIError = (res: express.Response, error: unknown, operation?: string) => {
  const message = error instanceof Error ? error.message : "Erro ao comunicar com a IA";
  console.error("[ai]", { operation, provider: resolveProvider(), error: message });
  const body: AIErrorResponse = {
    ok: false,
    error: message,
    provider: resolveProvider(),
  };
  res.status(500).json(body);
};

app.post("/api/ai", async (req, res) => {
  const body = req.body as AIRequest;

  try {
    if ("operation" in body && body.operation) {
      const result = await toAIResponse(body.operation, body.input);
      console.log("[ai]", {
        operation: body.operation,
        provider: result.provider,
        model: result.model,
        type: result.type,
      });
      return res.json(result);
    }

    const legacyBody = body as Extract<AIRequest, { model?: string }>;
    const messages = Array.isArray(legacyBody.messages) ? legacyBody.messages : [];
    const responseType = legacyBody.responseMimeType === "application/json" ? "structured" : "text";
    const providerResult = await invokeLegacyProvider(messages, responseType, legacyBody.model);

    const result: AISuccessResponse = {
      ok: true,
      type: responseType,
      provider: providerResult.provider,
      model: providerResult.model,
      text: providerResult.text,
      data: responseType === "structured" ? tryParseJson(providerResult.text) : null,
      raw: providerResult.raw,
    };

    console.log("[ai]", {
      operation: "legacy_client",
      provider: result.provider,
      model: result.model,
      type: result.type,
    });
    return res.json(result);
  } catch (error) {
    return sendAIError(res, error, "operation" in body ? body.operation : "legacy_client");
  }
});

app.post("/api/ai/route", async (req, res) => {
  try {
    const body = req.body as AIChatRouteRequest;
    const classification = await classifyAIIntent(body.message, body.context);
    return res.json({
      ok: true,
      intent: classification.intent,
      confidence: classification.confidence,
      executor:
        classification.intent === "nearby_discovery"
          ? "places"
          : classification.needsDeepModel
            ? "pollinations"
            : "groq",
      needsClarification: classification.intent === "clarification" || classification.confidence < 0.6,
      classification,
    });
  } catch (error) {
    return sendAIError(res, error, "route");
  }
});

app.post("/api/ai/chat", async (req, res) => {
  try {
    const body = req.body as AIChatRouteRequest;
    const result = await routeAIChat(body.message, body.context);
    return res.json(result);
  } catch (error) {
    return sendAIError(res, error, "chat");
  }
});

app.post("/api/places/nearby", async (req, res) => {
  try {
    const { lat, lng, radiusMeters, categories, mode, moment, placeQuery, city } = req.body as {
      lat?: number;
      lng?: number;
      radiusMeters?: number;
      categories?: string[];
      mode?: "brasil" | "mundo";
      moment?: string;
      placeQuery?: string;
      city?: string;
    };

    const items = await getNearbySuggestions({
      lat,
      lng,
      radiusMeters,
      categories,
      mode,
      moment,
      placeQuery,
      city,
    });

    return res.json({
      ok: true,
      source: "google_places",
      items,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Erro ao buscar lugares proximos",
    });
  }
});

app.get("/api/geo/reverse-geocode", async (req, res) => {
  try {
    const latitude = asFiniteNumber(req.query.lat);
    const longitude = asFiniteNumber(req.query.lng);
    if (latitude == null || longitude == null) {
      return res.status(400).json({ ok: false, error: "lat e lng sao obrigatorios" });
    }

    const result = await reverseGeocode(latitude, longitude);
    return res.json({
      ok: true,
      city: result.formattedLocation,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Erro no reverse geocode",
    });
  }
});

app.post("/api/gemini", async (req, res) => {
  const { model, contents, config } = req.body as {
    model?: string;
    contents?: Array<{ parts?: Array<{ text?: string }> }>;
    config?: { systemInstruction?: string | { parts?: Array<{ text?: string }> }; responseMimeType?: string };
  };

  try {
    const messages: ChatMessage[] = [];
    const systemText =
      typeof config?.systemInstruction === "string"
        ? config.systemInstruction
        : safeString(config?.systemInstruction?.parts?.[0]?.text);

    if (systemText) {
      messages.push({ role: "system", content: systemText });
    }

    for (const entry of contents || []) {
      const text = safeString(entry?.parts?.[0]?.text);
      if (text) {
        messages.push({ role: "user", content: text });
      }
    }

    const responseType = config?.responseMimeType === "application/json" ? "structured" : "text";
    const providerResult = await invokeLegacyProvider(messages, responseType, model);

    return res.json({
      ok: true,
      text: providerResult.text,
      data: responseType === "structured" ? tryParseJson(providerResult.text) : null,
      provider: providerResult.provider,
      model: providerResult.model,
      raw: providerResult.raw,
    });
  } catch (error) {
    return sendAIError(res, error, "legacy_gemini_route");
  }
});

app.get("/api/health/db", async (req, res) => {
  try {
    const status = await checkDatabaseHealth();
    res.json(status);
  } catch (error) {
    console.error("[health/db] Erro:", error);
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});

app.get("/api/profile", async (req, res) => {
  try {
    const user = await getProfile();
    res.json(user);
  } catch (error) {
    console.error("[profile:v2] Erro:", error);
    res.status(500).json({ error: "Erro ao buscar perfil", details: error instanceof Error ? error.message : String(error) });
  }
});

app.post("/api/upgrade", async (req, res) => {
  const { type, days } = req.body;
  try {
    const user = await upgradeProfile({ type, days });
    res.json(user);
  } catch (error) {
    console.error("[upgrade:v2] Erro:", error);
    res.status(500).json({ error: "Erro no upgrade" });
  }
});

app.put("/api/profile", async (req, res) => {
  const { name, bio, avatar } = req.body;
  try {
    const user = await updateProfile({ name, bio, avatar });
    res.json(user);
  } catch (error) {
    console.error("[profile:update:v2] Erro:", error);
    res.status(500).json({ error: "Erro ao atualizar perfil" });
  }
});

app.get("/api/posts", async (req, res) => {
  try {
    const posts = await getPosts();
    res.json(posts);
  } catch (error) {
    console.error("[posts:v2] Erro:", error);
    res.status(500).json({ error: "Erro ao buscar posts" });
  }
});

app.post("/api/posts", async (req, res) => {
  const { local, texto, img } = req.body;
  try {
    const post = await createPost({ local, texto, img });
    res.json(post);
  } catch (error) {
    console.error("[posts:create:v2] Erro:", error);
    res.status(500).json({ error: "Erro ao criar post" });
  }
});

app.post("/api/posts/:id/like", async (req, res) => {
  const { id } = req.params;
  try {
    const post = await likePost(parseInt(id, 10));
    res.json(post);
  } catch (error) {
    console.error("[posts:like:v2] Erro:", error);
    res.status(500).json({ error: "Erro ao curtir post" });
  }
});

app.post("/api/seals", async (req, res) => {
  const { name, icon, color } = req.body;
  try {
    const seal = await createSeal({ name, icon, color });
    res.json(seal);
  } catch (error) {
    console.error("[seals:create:v2] Erro:", error);
    res.status(500).json({ error: "Erro ao criar selo" });
  }
});

app.post("/api/favorites", async (req, res) => {
  const { localId } = req.body;
  try {
    const favorite = await addFavorite(localId);
    res.json(favorite);
  } catch (error) {
    console.error("[favorites:create:v2] Erro:", error);
    res.status(500).json({ error: "Erro ao favoritar" });
  }
});

app.delete("/api/favorites/:localId", async (req, res) => {
  const { localId } = req.params;
  try {
    await removeFavorite(parseInt(localId, 10));
    res.json({ status: "ok" });
  } catch (error) {
    console.error("[favorites:delete:v2] Erro:", error);
    res.status(500).json({ error: "Erro ao remover favorito" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);

    app.use("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api/")) {
        return next();
      }

      try {
        const indexPath = path.resolve(process.cwd(), "index.html");
        const template = await readFile(indexPath, "utf-8");
        const html = await vite.transformIndexHtml(req.originalUrl, template);

        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (error) {
        vite.ssrFixStacktrace(error as Error);
        next(error);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");

    app.use(express.static(distPath));

    app.get("*", (req, res) => {
      if (req.path.startsWith("/api/")) {
        return res.status(404).json({ error: "API route not found" });
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Capitao, o servidor esta no ar em http://localhost:${PORT}`);
  });
}

startServer();
