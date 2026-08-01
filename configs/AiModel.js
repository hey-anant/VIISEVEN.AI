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
      console.warn("NEXT_PUBLIC_GEMINI_API_KEY is not set");
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

const MODEL_NAMES = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-pro"];

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

export const chatSession = {
  sendMessage: async (message) => {
    let lastError = null;
    for (const modelName of MODEL_NAMES) {
      try {
        const modelInstance = getModelByName(modelName);
        const session = modelInstance.startChat({
          generationConfig,
          history: [],
        });
        return await session.sendMessage(message);
      } catch (err) {
        lastError = err;
        if (err.message && err.message.includes("429")) {
          console.warn(`Model ${modelName} hit 429 rate limit, trying next model...`);
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }
};

export const GenAiCode = {
  sendMessage: async (message) => {
    let lastError = null;
    for (const modelName of MODEL_NAMES) {
      try {
        const modelInstance = getModelByName(modelName);
        const session = modelInstance.startChat({
          generationConfig: CodeGenerationConfig,
          history: [],
        });
        return await session.sendMessage(message);
      } catch (err) {
        lastError = err;
        if (err.message && err.message.includes("429")) {
          console.warn(`Model ${modelName} hit 429 rate limit, trying next model...`);
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }
};
