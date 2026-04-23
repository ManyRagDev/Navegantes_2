import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { readFile } from "node:fs/promises";
import cors from "cors";
import dotenv from "dotenv";
import { reverseGeocode } from "./server/geo/geocode";
import { buildCaptainGreeting, classifyAIIntent, getNearbySuggestionsDetailed, routeAIChat } from "./server/ai/router";
import { callPollinations } from "./server/ai/providers/pollinations";
import { pingGroq } from "./server/ai/providers/groq";
import { pingPollinations } from "./server/ai/providers/pollinations";
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

// --- HELPERS / UTILITARIOS ---

const asFiniteNumber = (val: any): number | null => {
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : null;
};

const safeString = (val: any, fallback = ""): string => {
  if (typeof val === "string") return val;
  if (val == null) return fallback;
  return String(val);
};

const sendAIError = (res: express.Response, error: unknown, operation?: string) => {
  const message = error instanceof Error ? error.message : "Erro ao comunicar com a IA";
  console.error("[ai:error]", { operation, error: message });
  res.status(500).json({
    ok: false,
    error: message,
    operation
  });
};

// --- ROTAS DE IA (HÍBRIDA) ---

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
    const { lat, lng, radiusMeters, categories, mode, moment, placeQuery, city, surface, requestedCount, safetyProfile } = req.body as {
      lat?: number;
      lng?: number;
      radiusMeters?: number;
      categories?: string[];
      mode?: "brasil" | "mundo";
      moment?: string;
      placeQuery?: string;
      city?: string;
      surface?: "home" | "chat" | "itinerary" | "story";
      requestedCount?: number;
      safetyProfile?: "equilibrado" | "priorizar_seguranca";
    };

    const result = await getNearbySuggestionsDetailed({
      lat,
      lng,
      radiusMeters,
      categories,
      mode,
      moment,
      placeQuery,
      city,
      surface,
      requestedCount,
      safetyProfile,
    });

    console.log("[api/places/nearby][response]", {
      surface: surface || "auto",
      requestedCount: requestedCount || null,
      itemsLength: result.items.length,
      firstItem: result.items[0]
        ? {
            placeId: result.items[0].placeId,
            curationSource: result.items[0].curationSource || null,
            urbanRole: result.items[0].urbanRole || null,
          }
        : null,
      debugVersion: result.debug.debugVersion,
      debugPipeline: result.debug.debugPipeline,
      debug: result.debug,
    });

    return res.json({
      ok: true,
      source: "google_places",
      items: result.items,
      debugVersion: result.debug.debugVersion,
      debugPipeline: result.debug.debugPipeline,
      debug: result.debug,
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

// --- ROTAS LEGADAS / DADOS ---

app.get("/api/health/db", async (req, res) => {
  try {
    const status = await checkDatabaseHealth();
    res.json(status);
  } catch (error) {
    console.error("[health/db] Erro:", error);
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});

app.get("/api/health/ai", async (req, res) => {
  const timestamp = new Date().toISOString();
  const [groq, pollinations] = await Promise.all([
    pingGroq().catch((e) => ({ ok: false as const, provider: "groq" as const, error: e.message, latencyMs: 0 })),
    pingPollinations().catch((e) => ({ ok: false as const, provider: "pollinations" as const, error: e.message, latencyMs: 0 })),
  ]);
  const googlePlacesKey = Boolean(
    process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY,
  );
  const allOk = groq.ok && pollinations.ok && googlePlacesKey;
  res.json({
    ok: allOk,
    timestamp,
    providers: { groq, pollinations, google_places: { ok: googlePlacesKey, provider: "google_places" } },
    activeProvider: process.env.AI_PROVIDER || "pollinations",
    groqModel: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
  });
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
    console.error("[favorites:delete:v2] Erve:v2 error:", error);
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
