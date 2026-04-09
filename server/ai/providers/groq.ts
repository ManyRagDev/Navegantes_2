import type { ChatMessage, IntentClassification } from "../types";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";

const getGroqApiKey = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY nao configurada no servidor");
  }
  return apiKey;
};

const groqModel = () => process.env.GROQ_MODEL || "openai/gpt-oss-20b";

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

export const classifyIntentWithGroq = async (
  messages: ChatMessage[],
  schema: Record<string, unknown>,
) => {
  return callGroqStructured<IntentClassification>(messages, "intent_classification", schema, {
    maxCompletionTokens: 256,
  });
};
