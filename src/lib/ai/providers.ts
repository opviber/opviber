import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createMistral } from "@ai-sdk/mistral";
import { createCohere } from "@ai-sdk/cohere";

export function getModelInstance(provider: string, apiKey: string, modelName?: string) {
  switch (provider) {
    case "openai": {
      const openai = createOpenAI({ apiKey });
      return openai(modelName || "gpt-4o");
    }
    case "anthropic": {
      const anthropic = createAnthropic({ apiKey });
      return anthropic(modelName || "claude-3-5-sonnet-20241022");
    }
    case "google": {
      const google = createGoogleGenerativeAI({ apiKey });
      return google(modelName || "gemini-1.5-flash");
    }
    case "mistral": {
      const mistral = createMistral({ apiKey });
      return mistral(modelName || "mistral-large-latest");
    }
    case "cohere": {
      const cohere = createCohere({ apiKey });
      return cohere(modelName || "command-r-plus");
    }
    case "groq": {
      // Groq is OpenAI-compatible
      const groq = createOpenAI({
        baseURL: "https://api.groq.com/openai/v1",
        apiKey,
      });
      return groq(modelName || "llama3-70b-8192");
    }
    case "xai": {
      // xAI Grok is OpenAI-compatible
      const xai = createOpenAI({
        baseURL: "https://api.x.ai/v1",
        apiKey,
      });
      return xai(modelName || "grok-beta");
    }
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}
