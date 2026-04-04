import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

type AIProvider = "pollinations" | "gemini";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

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

type OperationSpec = {
  messages: ChatMessage[];
  responseType: "text" | "structured";
};

const resolveProvider = (): AIProvider => {
  const envProvider = (process.env.AI_PROVIDER || "pollinations").toLowerCase();
  return envProvider === "gemini" ? "gemini" : "pollinations";
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

const ensureArray = (value: unknown) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return [value];
  return [];
};

const normalizeStringListItem = (value: unknown, index: number) => {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  return {
    id: asFiniteNumber(item.id) ?? index + 1,
    title: safeString(item.title, `Sugestão ${index + 1}`),
    description: safeString(item.description, "Sem descrição disponível."),
    time: safeString(item.time, "Horário Livre"),
    icon: safeString(item.icon, "🧭"),
    rating: typeof item.rating === "number" ? item.rating : undefined,
    img: safeString(item.img),
  };
};

const normalizeStructuredData = (operation: string, rawText: string) => {
  const parsed = tryParseJson(rawText);

  if (operation === "city_lookup") {
    if (typeof parsed === "string") {
      return { city: parsed.trim() };
    }
    if (parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>;
      return {
        city:
          safeString(record.city) ||
          safeString(record.location) ||
          safeString(record.name) ||
          rawText.trim(),
      };
    }
    return { city: rawText.trim() };
  }

  const items = ensureArray(parsed)
    .map((item, index) => normalizeStringListItem(item, index))
    .filter(Boolean);

  if (items.length > 0) {
    return { items };
  }

  return { items: [] };
};

const buildOperationSpec = (
  operation:
    | "captain_chat"
    | "captain_greeting"
    | "city_lookup"
    | "quick_suggestions"
    | "dashboard_suggestions"
    | "itinerary_suggestions",
  input: Record<string, unknown> = {},
): OperationSpec => {
  switch (operation) {
    case "city_lookup": {
      const latitude = safeString(input.latitude, "0");
      const longitude = safeString(input.longitude, "0");
      return {
        responseType: "structured",
        messages: [
          {
            role: "user",
            content: `O usuário está nas coordenadas Latitude: ${latitude}, Longitude: ${longitude}. Identifique a cidade e o estado/país aproximado. Retorne apenas JSON no formato {"city":"São Paulo, Brasil"}.`,
          },
        ],
      };
    }
    case "captain_greeting": {
      const location = safeString(input.location, "coordenadas interessantes");
      return {
        responseType: "text",
        messages: [
          {
            role: "system",
            content:
              'Você é um guia de viagem vintage e experiente chamado "O Capitão". Seu tom é nostálgico, encorajador e cheio de curiosidades históricas. Mantenha as respostas curtas. Use emojis retrô como 🧭, ⚓, 📜, 🗺️.',
          },
          {
            role: "user",
            content: `O usuário abriu o guia. Ele está em ${location}. Dê as boas-vindas como "O Capitão", mencione que você o localizou pelo GPS e comente algo breve e nostálgico sobre estar nessa região ou sobre a jornada de explorador. Seja breve (máximo 2 parágrafos).`,
          },
        ],
      };
    }
    case "captain_chat": {
      const userText = safeString(input.userText);
      const mode = safeString(input.mode, "o Mundo");
      return {
        responseType: "text",
        messages: [
          {
            role: "system",
            content: `Você é um guia de viagem vintage e experiente chamado "O Capitão". Seu tom é nostálgico, encorajador e cheio de curiosidades históricas. Você está ajudando o usuário a explorar ${mode}. Mantenha as respostas curtas (máximo 3 parágrafos). Use emojis retrô como 🧭, ⚓, 📜, 🗺️. Se o usuário perguntar sobre um lugar específico, dê uma dica "escondida" ou pouco conhecida.`,
          },
          {
            role: "user",
            content: userText,
          },
        ],
      };
    }
    case "quick_suggestions": {
      const city = safeString(input.city);
      const weather = safeString(input.weather);
      return {
        responseType: "structured",
        messages: [
          {
            role: "user",
            content: `Estou em ${city}. Baseado no clima de ${weather}, sugira 3 atividades rápidas ou locais próximos para visitar agora. Retorne apenas JSON no formato {"items":[{"id":1,"title":"Nome","description":"Por que ir agora","icon":"emoji"}]}.`,
          },
        ],
      };
    }
    case "dashboard_suggestions": {
      const city = safeString(input.city);
      return {
        responseType: "structured",
        messages: [
          {
            role: "user",
            content: `Estou em ${city}. Sugira os 10 melhores locais para visitar agora (restaurantes, parques ou pontos turísticos). Retorne apenas JSON no formato {"items":[{"id":"ia1","title":"Nome","description":"Por que ir","icon":"emoji","rating":4.9,"img":"https://images.unsplash.com/..."}]}.`,
          },
        ],
      };
    }
    case "itinerary_suggestions": {
      const destination = safeString(input.destination);
      return {
        responseType: "structured",
        messages: [
          {
            role: "user",
            content: `Sugira 5 pontos turísticos imperdíveis em ${destination}. Retorne apenas JSON no formato {"items":[{"id":1,"title":"Nome","description":"Breve descrição","time":"09:00"}]}.`,
          },
        ],
      };
    }
  }
};

const callPollinations = async (messages: ChatMessage[], responseType: "text" | "structured", model?: string) => {
  const apiKey = process.env.POLLINATIONS_API_KEY;
  if (!apiKey) {
    throw new Error("POLLINATIONS_API_KEY não configurada no servidor");
  }

  const selectedModel = model || process.env.AI_TEXT_MODEL || "openai";
  const body: Record<string, unknown> = {
    model: selectedModel,
    messages,
    seed: -1,
  };

  if (responseType === "structured") {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      safeString((data as Record<string, unknown>)?.error, `Falha do provedor Pollinations (${response.status})`),
    );
  }

  return {
    provider: "pollinations" as const,
    model: safeString((data as Record<string, unknown>).model, selectedModel),
    text: safeString((data as Record<string, unknown>)?.choices?.[0]?.message?.content),
    raw: data,
  };
};

const callGemini = async (messages: ChatMessage[], responseType: "text" | "structured", model?: string) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada no servidor");
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
    generationConfig:
      responseType === "structured"
        ? { responseMimeType: "application/json" }
        : undefined,
    systemInstruction: systemInstruction
      ? { parts: [{ text: systemInstruction }] }
      : undefined,
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
      (data as { error?: { message?: unknown } }).error &&
      typeof (data as { error?: { message?: unknown } }).error?.message === "string"
        ? (data as { error?: { message?: string } }).error!.message
        : `Falha do provedor Gemini (${response.status})`;
    throw new Error(
      errorMessage,
    );
  }

  const text =
    safeString(
      (data as Record<string, unknown>)?.candidates?.[0]?.content?.parts?.[0]?.text,
    ) || "";

  return {
    provider: "gemini" as const,
    model: selectedModel,
    text,
    raw: data,
  };
};

const invokeProvider = async (messages: ChatMessage[], responseType: "text" | "structured", model?: string) => {
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
  const spec = buildOperationSpec(operation, input);
  const providerResult = await invokeProvider(spec.messages, spec.responseType);
  const normalizedData =
    spec.responseType === "structured"
      ? normalizeStructuredData(operation, providerResult.text)
      : null;

  return {
    ok: true,
    type: spec.responseType,
    provider: providerResult.provider,
    model: providerResult.model,
    text: providerResult.text,
    data: normalizedData,
    raw: providerResult.raw,
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

// --- IA UNIFICADA ---
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
    const providerResult = await invokeProvider(messages, responseType, legacyBody.model);

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

// --- ROTA LEGADA DO GEMINI PARA BUILDS ANTIGOS ---
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
    const providerResult = await invokeProvider(messages, responseType, model);

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

// --- API ROUTES ---

app.get("/api/profile", async (req, res) => {
  try {
    let user = await prisma.user.findUnique({
      where: { id: 1 },
      include: {
        seals: true,
        favorites: true,
        itineraries: {
          include: {
            days: {
              include: { stops: true },
            },
          },
        },
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: 1,
          email: "navegante@exemplo.com",
          name: "Capitão Navegante",
          bio: "Explorando os sete mares e as ruas de paralelepípedo.",
          avatar: "https://i.pravatar.cc/150?u=navegante",
          credits: 1,
        },
        include: {
          seals: true,
          favorites: true,
          itineraries: {
            include: {
              days: {
                include: { stops: true },
              },
            },
          },
        },
      });
    }
    res.json(user);
  } catch (error) {
    console.error("[profile] Erro:", error);
    res.status(500).json({ error: "Erro ao buscar perfil", details: error instanceof Error ? error.message : String(error) });
  }
});

app.post("/api/upgrade", async (req, res) => {
  const { type, days } = req.body;
  try {
    let data = {};
    if (type === "trip") {
      const duration = days || 15;
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + duration);
      data = { activeTripUntil: expirationDate };
    } else if (type === "lifetime") {
      data = { isPremium: true };
    }

    const user = await prisma.user.update({
      where: { id: 1 },
      data,
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Erro no upgrade" });
  }
});

app.put("/api/profile", async (req, res) => {
  const { name, bio, avatar } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: 1 },
      data: { name, bio, avatar },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar perfil" });
  }
});

app.get("/api/posts", async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        user: true,
        comments: {
          include: { user: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar posts" });
  }
});

app.post("/api/posts", async (req, res) => {
  const { local, texto, img } = req.body;
  try {
    const post = await prisma.post.create({
      data: {
        userId: 1,
        local,
        texto,
        img,
      },
      include: { user: true },
    });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar post" });
  }
});

app.post("/api/posts/:id/like", async (req, res) => {
  const { id } = req.params;
  try {
    const post = await prisma.post.update({
      where: { id: parseInt(id) },
      data: { likes: { increment: 1 } },
    });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: "Erro ao curtir post" });
  }
});

app.post("/api/seals", async (req, res) => {
  const { name, icon, color } = req.body;
  try {
    const seal = await prisma.seal.create({
      data: {
        userId: 1,
        name,
        icon,
        color,
      },
    });
    res.json(seal);
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar selo" });
  }
});

app.post("/api/favorites", async (req, res) => {
  const { localId } = req.body;
  try {
    const favorite = await prisma.favorite.create({
      data: {
        userId: 1,
        localId,
      },
    });
    res.json(favorite);
  } catch (error) {
    res.status(500).json({ error: "Erro ao favoritar" });
  }
});

app.delete("/api/favorites/:localId", async (req, res) => {
  const { localId } = req.params;
  try {
    await prisma.favorite.deleteMany({
      where: {
        userId: 1,
        localId: parseInt(localId),
      },
    });
    res.json({ status: "ok" });
  } catch (error) {
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
    console.log(`Capitão, o servidor está no ar em http://localhost:${PORT}`);
  });
}

startServer();
