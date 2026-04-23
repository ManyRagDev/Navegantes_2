import type { ChatMessage, IntentClassification } from "../types";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";

const getGroqApiKey = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY nao configurada no servidor");
  }
  return apiKey;
};

const groqModel = () => "llama-3.3-70b-versatile";

const extractText = (data: any) => data?.choices?.[0]?.message?.content ?? "";

export const callGroqText = async (
  messages: ChatMessage[],
  options?: { temperature?: number; maxCompletionTokens?: number; model?: string },
) => {
  const response = await fetch(GROQ_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getGroqApiKey()}`,
    },
    body: JSON.stringify({
      model: options?.model || groqModel(),
      messages,
      temperature: options?.temperature ?? 0.3,
      max_completion_tokens: options?.maxCompletionTokens ?? 512,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `Falha do provedor Groq (${response.status})`);
  }

  return {
    provider: "groq" as const,
    model: data?.model || options?.model || groqModel(),
    text: extractText(data),
    raw: data,
  };
};

export const callGroqStructured = async <T>(
  messages: ChatMessage[],
  schemaName: string,
  schema: Record<string, unknown>,
  options?: { model?: string; temperature?: number; maxCompletionTokens?: number },
): Promise<{ provider: "groq"; model: string; text: string; data: T; raw: unknown }> => {
  const response = await fetch(GROQ_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getGroqApiKey()}`,
    },
    body: JSON.stringify({
      model: options?.model || groqModel(),
      messages,
      temperature: options?.temperature ?? 0.1,
      max_completion_tokens: options?.maxCompletionTokens ?? 512,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: schemaName,
          strict: true,
          schema,
        },
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `Falha do provedor Groq (${response.status})`);
  }

  const text = extractText(data);
  return {
    provider: "groq",
    model: data?.model || options?.model || groqModel(),
    text,
    data: JSON.parse(text) as T,
    raw: data,
  };
};

/** Lightweight health-check: sends a minimal request to confirm Groq connectivity. */
export const pingGroq = async () => {
  const start = Date.now();
  const hasKey = Boolean(process.env.GROQ_API_KEY);
  if (!hasKey) {
    return { ok: false as const, provider: "groq" as const, error: "GROQ_API_KEY ausente", latencyMs: 0 };
  }
  try {
    const response = await fetch(GROQ_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getGroqApiKey()}`,
      },
      body: JSON.stringify({
        model: groqModel(),
        messages: [{ role: "user", content: "ping" }],
        max_completion_tokens: 5,
        temperature: 0,
      }),
    });
    const latencyMs = Date.now() - start;
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { ok: false as const, provider: "groq" as const, error: data?.error?.message || `HTTP ${response.status}`, latencyMs };
    }
    return { ok: true as const, provider: "groq" as const, model: groqModel(), latencyMs };
  } catch (error) {
    return { ok: false as const, provider: "groq" as const, error: error instanceof Error ? error.message : String(error), latencyMs: Date.now() - start };
  }
};

export const classifyIntentWithGroq = async (
  messages: ChatMessage[],
  schema: Record<string, unknown>,
) => {
  return callGroqStructured<IntentClassification>(messages, "intent_classification", schema, {
    maxCompletionTokens: 256,
  });
};
