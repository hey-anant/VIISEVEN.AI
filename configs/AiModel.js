/**
 * AI Model Configuration — Hybrid (Gemini Direct + OpenRouter Fallback)
 *
 * Uses Google Gemini API directly for speed (free tier: 15 RPM, 1M tokens/day)
 * Falls back to OpenRouter free models if Gemini hits rate limits.
 *
 * Return shape: { response: { text: () => string } }
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Call Google Gemini API directly (fastest, free tier available)
 */
async function callGeminiDirect(message, modelName, jsonMode = false) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null; // Skip if no Gemini key, fall through to OpenRouter

  const url = `${GEMINI_API_URL}/${modelName}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ parts: [{ text: message }] }],
    generationConfig: {
      temperature: 1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: jsonMode ? 16384 : 2048,
      responseMimeType: jsonMode ? "application/json" : "text/plain",
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    const err = new Error(`Gemini API error ${res.status}: ${errorBody}`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new Error("Empty response from Gemini");
  }

  return content;
}

/**
 * Call OpenRouter API (fallback for when Gemini is rate-limited)
 */
async function callOpenRouter(message, modelName, jsonMode = false) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set.");
  }

  const body = {
    model: modelName,
    messages: [{ role: "user", content: message }],
    temperature: 1,
    top_p: 0.95,
    max_tokens: jsonMode ? 16384 : 2048,
  };

  if (jsonMode) {
    body.messages.unshift({
      role: "system",
      content: "You must respond with valid JSON only. No markdown, no explanation, just the JSON object.",
    });
  }

  const res = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "VIISEVEN",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    const err = new Error(`OpenRouter API error ${res.status}: ${errorBody}`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message || JSON.stringify(data.error));
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from OpenRouter");
  }

  return content;
}

// Model priority: Gemini direct (fast, free) → OpenRouter free models (slow but unlimited)
const STRATEGIES = [
  { provider: "gemini", model: "gemini-2.0-flash" },
  { provider: "gemini", model: "gemini-2.5-flash" },
  { provider: "openrouter", model: "inclusionai/ling-3.0-flash:free" },
  { provider: "openrouter", model: "google/gemma-4-26b-a4b-it:free" },
];

/**
 * Sends a message with automatic provider/model fallback and backoff.
 */
async function sendWithRetry(message, jsonMode = false) {
  let lastError = null;

  for (let i = 0; i < STRATEGIES.length; i++) {
    const { provider, model } = STRATEGIES[i];
    try {
      let text = null;

      if (provider === "gemini") {
        text = await callGeminiDirect(message, model, jsonMode);
        if (text === null) continue; // No Gemini key, skip to next
      } else {
        text = await callOpenRouter(message, model, jsonMode);
      }

      console.log(`[AiModel] Success with ${provider}/${model}`);
      return {
        response: {
          text: () => text,
        },
      };
    } catch (err) {
      lastError = err;
      const isRetryable =
        err.status === 429 ||
        err.status === 503 ||
        err.status === 402 ||
        (err.message &&
          (err.message.includes("429") ||
            err.message.includes("rate") ||
            err.message.includes("quota") ||
            err.message.includes("RESOURCE_EXHAUSTED")));

      if (isRetryable) {
        const delayMs = Math.min(2000 * Math.pow(2, i), 15000);
        console.warn(`[AiModel] ${provider}/${model} failed (${err.status || "error"}), waiting ${delayMs/1000}s...`);
        await sleep(delayMs);
        continue;
      }
      // Non-retryable error: try next model anyway
      console.warn(`[AiModel] ${provider}/${model} error: ${err.message}, trying next...`);
      continue;
    }
  }
  throw lastError || new Error("All AI models failed");
}

// Exported with the same interface as before
export const chatSession = {
  sendMessage: async (message) => sendWithRetry(message, false),
};

export const GenAiCode = {
  sendMessage: async (message) => sendWithRetry(message, true),
};
