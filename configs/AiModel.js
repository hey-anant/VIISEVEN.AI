/**
 * AI Model Configuration — OpenRouter
 *
 * Uses OpenRouter's OpenAI-compatible API for access to Gemini and other models
 * without the aggressive rate limits of Google's direct API.
 *
 * Return shape: { response: { text: () => string } }
 * This matches the old @google/generative-ai SDK so the API routes work unchanged.
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Models to try in order (OpenRouter naming convention)
const MODEL_NAMES = [
  "google/gemini-2.0-flash-exp:free",
  "google/gemini-2.5-flash-preview-05-20",
  "google/gemini-2.5-pro-preview-05-06",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calls OpenRouter's chat completions API.
 * @param {string} message - The user prompt
 * @param {string} modelName - OpenRouter model ID
 * @param {boolean} jsonMode - If true, requests JSON output
 * @returns {string} The AI response text
 */
async function callOpenRouter(message, modelName, jsonMode = false) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not set. Add it to your .env.local file."
    );
  }

  const body = {
    model: modelName,
    messages: [{ role: "user", content: message }],
    temperature: 1,
    top_p: 0.95,
    max_tokens: 8192,
  };

  // Request JSON output for code generation
  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Syntrix",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    const err = new Error(
      `OpenRouter API error ${res.status}: ${errorBody}`
    );
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

/**
 * Sends a message with automatic model fallback and exponential backoff.
 * Returns the same shape as the old Gemini SDK: { response: { text: () => string } }
 */
async function sendWithRetry(message, jsonMode = false) {
  let lastError = null;
  const maxRounds = 2;

  for (let round = 0; round < maxRounds; round++) {
    for (let i = 0; i < MODEL_NAMES.length; i++) {
      const modelName = MODEL_NAMES[i];
      try {
        const text = await callOpenRouter(message, modelName, jsonMode);

        // Return the same shape as @google/generative-ai SDK
        // so route.jsx files don't need changes
        return {
          response: {
            text: () => text,
          },
        };
      } catch (err) {
        lastError = err;
        const isRateLimit =
          err.status === 429 ||
          (err.message &&
            (err.message.includes("429") ||
              err.message.includes("rate") ||
              err.message.includes("quota")));

        if (isRateLimit) {
          const attempt = round * MODEL_NAMES.length + i;
          const delayMs = Math.min(2000 * Math.pow(2, attempt), 30000);
          console.warn(
            `Model ${modelName} hit rate limit (attempt ${attempt + 1}). Waiting ${delayMs / 1000}s...`
          );
          await sleep(delayMs);
          continue;
        }
        // Non-rate-limit errors: throw immediately
        throw err;
      }
    }
  }
  throw lastError;
}

// Exported with the same interface as before — no changes needed in API routes
export const chatSession = {
  sendMessage: async (message) => sendWithRetry(message, false),
};

export const GenAiCode = {
  sendMessage: async (message) => sendWithRetry(message, true),
};
