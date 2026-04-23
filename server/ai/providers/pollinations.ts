import type { ChatMessage } from "../types";

const safeString = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);

/** Lightweight health-check: sends a minimal request to confirm Pollinations connectivity. */
export const pingPollinations = async () => {
  const start = Date.now();
  const hasKey = Boolean(process.env.POLLINATIONS_API_KEY);
  if (!hasKey) {
    return { ok: false as const, provider: "pollinations" as const, error: "POLLINATIONS_API_KEY ausente", latencyMs: 0 };
  }
  try {
    const selectedModel = process.env.AI_TEXT_MODEL || "openai";
    const response = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.POLLINATIONS_API_KEY}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: "user", content: "ping" }],
        seed: -1,
      }),
    });
    const latencyMs = Date.now() - start;
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { ok: false as const, provider: "pollinations" as const, error: safeString((data as any)?.error, `HTTP ${response.status}`), latencyMs };
    }
    return { ok: true as const, provider: "pollinations" as const, model: selectedModel, latencyMs };
  } catch (error) {
    return { ok: false as const, provider: "pollinations" as const, error: error instanceof Error ? error.message : String(error), latencyMs: Date.now() - start };
  }
};

export const callPollinations = async (
  messages: ChatMessage[],
  responseType: "text" | "structured",
  model?: string,
) => {
  const apiKey = process.env.POLLINATIONS_API_KEY;
  if (!apiKey) {
    throw new Error("POLLINATIONS_API_KEY nao configurada no servidor");
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
    text: safeString((data as any)?.choices?.[0]?.message?.content),
    raw: data,
  };
};
