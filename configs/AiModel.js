/**
 * AI Model Configuration — Hybrid (Google Gemini + OpenRouter Fallback)
 *
 * Strategy: Try Gemini free tier first, fall back to OpenRouter.
 * Return shape: { response: { text: () => string } }
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Call Google Gemini API directly (free tier)
 */
async function callGeminiDirect(message, modelName, jsonMode = false) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const url = `${GEMINI_API_URL}/${modelName}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ parts: [{ text: message }] }],
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: jsonMode ? 16384 : 4096,
      responseMimeType: jsonMode ? "application/json" : "text/plain",
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

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
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

/**
 * Call OpenRouter API (fallback)
 */
async function callOpenRouter(message, modelName, jsonMode = false) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set.");
  }

  const body = {
    model: modelName,
    messages: [{ role: "user", content: message }],
    temperature: 0.7,
    top_p: 0.95,
    max_tokens: jsonMode ? 16384 : 4096,
  };

  if (jsonMode) {
    body.messages.unshift({
      role: "system",
      content: "You must respond with valid JSON only. Do NOT include markdown code fences (```json or ```). Output ONLY raw JSON.",
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  try {
    const res = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "VIISEVEN.AI",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

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
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

// Cascading fallback: Gemini free tier → OpenRouter
const STRATEGIES = [
  { provider: "gemini", model: "gemini-2.0-flash" },
  { provider: "gemini", model: "gemini-2.5-flash" },
  { provider: "openrouter", model: "google/gemini-2.0-flash-exp:free" },
  { provider: "openrouter", model: "meta-llama/llama-3.1-8b-instruct:free" },
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
        if (text === null) continue; // API key missing, skip
      } else {
        text = await callOpenRouter(message, model, jsonMode);
      }

      console.log(`[AiModel] ✅ Success with ${provider}/${model}`);
      return {
        response: {
          text: () => text,
        },
      };
    } catch (err) {
      lastError = err;
      console.warn(`[AiModel] ❌ ${provider}/${model} failed: ${err.message?.substring(0, 120)}`);

      const isRetryable =
        err.status === 429 ||
        err.status === 503 ||
        err.status === 402 ||
        err.status === 400 ||
        (err.message &&
          (err.message.includes("429") ||
            err.message.includes("rate") ||
            err.message.includes("quota") ||
            err.message.includes("RESOURCE_EXHAUSTED") ||
            err.message.includes("API_KEY_INVALID")));

      if (isRetryable) {
        const delayMs = Math.min(1500 * Math.pow(2, i), 8000);
        console.warn(`[AiModel] ⏳ Retryable error, waiting ${delayMs/1000}s before next strategy...`);
        await sleep(delayMs);
      }
      continue;
    }
  }
  throw lastError || new Error("All AI models failed. Please check your API keys and try again.");
}

export const chatSession = {
  sendMessage: async (message) => sendWithRetry(message, false),
};

export const GenAiCode = {
  sendMessage: async (message) => sendWithRetry(message, true),
};
