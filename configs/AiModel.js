import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

// Lazy initialization to prevent build-time errors
let genAI = null;
let model = null;

const getModel = () => {
  if (!model) {
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Only initialize if we have an API key (prevents build-time errors)
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. Check your .env.local file.");
      return null;
    }
    
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });
  }
  return model;
};

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

const CodeGenerationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

// Export functions that lazily initialize the chat sessions
export const getChatSession = () => {
  const currentModel = getModel();
  if (!currentModel) {
    throw new Error("Gemini API key is not configured");
  }
  return currentModel.startChat({
    generationConfig,
    history: [],
  });
};

export const getGenAiCode = () => {
  const currentModel = getModel();
  if (!currentModel) {
    throw new Error("Gemini API key is not configured");
  }
  return currentModel.startChat({
    generationConfig: CodeGenerationConfig,
    history: [],
  });
};

const MODEL_NAMES = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.5-pro"];

const getModelByName = (modelName) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI.getGenerativeModel({ model: modelName });
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sends a message with automatic model fallback and exponential backoff on 429.
 * - Tries each model in MODEL_NAMES order.
 * - On 429: waits with backoff (2s, 4s, 8s...) then tries the next model.
 * - After exhausting all models, retries once from the first model with a longer delay.
 */
async function sendWithRetry(message, genConfig) {
  let lastError = null;
  const maxRounds = 2; // try the full model list up to 2 times

  for (let round = 0; round < maxRounds; round++) {
    for (let i = 0; i < MODEL_NAMES.length; i++) {
      const modelName = MODEL_NAMES[i];
      try {
        const modelInstance = getModelByName(modelName);
        const session = modelInstance.startChat({
          generationConfig: genConfig,
          history: [],
        });
        return await session.sendMessage(message);
      } catch (err) {
        lastError = err;
        const is429 =
          err.message && (err.message.includes("429") || err.message.includes("quota") || err.message.includes("RESOURCE_EXHAUSTED"));

        if (is429) {
          // Exponential backoff: 2s, 4s, 8s per attempt across all rounds
          const attempt = round * MODEL_NAMES.length + i;
          const delayMs = Math.min(2000 * Math.pow(2, attempt), 30000);
          console.warn(
            `Model ${modelName} hit 429 rate limit (attempt ${attempt + 1}). Waiting ${delayMs / 1000}s...`
          );
          await sleep(delayMs);
          continue;
        }
        // Non-429 errors: throw immediately
        throw err;
      }
    }
  }
  throw lastError;
}

export const chatSession = {
  sendMessage: async (message) => sendWithRetry(message, generationConfig),
};

export const GenAiCode = {
  sendMessage: async (message) => sendWithRetry(message, CodeGenerationConfig),
};

