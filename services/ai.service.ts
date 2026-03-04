import { DEFAULT_GEMINI_MODEL } from "@/constants/gemini.models";
import {
  EOD_WORK_SUMMARY_PROMPT,
  TASK_FORMAT_PROMPT,
} from "@/constants/task.ai.prompt";
import { modelStorage } from "@/services/storage";
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

async function getModel() {
  const selectedModelId = await modelStorage.getSelectedModel();
  return genAI.getGenerativeModel({ model: selectedModelId || DEFAULT_GEMINI_MODEL });
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  tags: string[];
  dueDate: string | null;
  estimatedTime: string;
  createdAt: string;
}

/**
 * Strips markdown code fences from AI responses so JSON.parse works.
 */
function cleanAIResponse(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
  return cleaned.trim();
}

function getRetryDelay(error: any, attempt: number, baseDelayMs: number): number | null {
  const message = error?.message || error?.toString() || "";
  const isRateLimit = message.includes("429") || message.includes("quota") || message.includes("RATE_LIMIT");
  const isServiceUnavailable = message.includes("503") || message.includes("overloaded") || message.includes("UNAVAILABLE");

  if (!isRateLimit && !isServiceUnavailable) return null;

  // Try to parse the retryDelay from the API error message (e.g., "Please retry in 10.9s")
  const retryMatch = message.match(/retry in ([\d.]+)s/i);
  if (retryMatch) {
    return Math.ceil(parseFloat(retryMatch[1])) * 1000 + 500;
  }

  // Exponential backoff fallback
  return baseDelayMs * Math.pow(2, attempt - 1);
}

function getErrorMessage(error: any): string {
  const message = error?.message || error?.toString() || "";
  if (message.includes("429") || message.includes("quota") || message.includes("RATE_LIMIT")) {
    return "Rate limit reached. Please wait a moment and try again, or switch to a different AI model in Profile settings.";
  }
  if (message.includes("403") || message.includes("API_KEY")) {
    return "Invalid API key. Please check your Gemini API key configuration.";
  }
  if (message.includes("404")) {
    return "Selected AI model is no longer available. Please switch to a different model in Profile settings.";
  }
  if (message.includes("503") || message.includes("overloaded")) {
    return "AI service is temporarily overloaded. Please try again in a few seconds.";
  }
  return "AI Service is currently unavailable. Please try again later.";
}

export const aiService = {
  // send message to ai and get structured task JSON
  async sendMessage(userTask: string): Promise<string> {
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 2000;

    const finalPrompt = `${TASK_FORMAT_PROMPT}\n\nUser Task Input:\n${userTask}\n\nReturn JSON only.`;
    const model = await getModel();

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await model.generateContent(finalPrompt);
        const rawText = result.response.text();
        const cleaned = cleanAIResponse(rawText);

        // Validate it's parseable JSON before returning
        JSON.parse(cleaned);
        return cleaned;
      } catch (error: any) {
        const delay = getRetryDelay(error, attempt, RETRY_DELAY_MS);

        if (attempt === MAX_RETRIES || delay === null) {
          console.error(`AI sendMessage failed after ${attempt} attempts:`, error);
          throw new Error(getErrorMessage(error));
        }

        console.log(`AI Service error (attempt ${attempt}/${MAX_RETRIES}). Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error("Failed to get response from AI service.");
  },

  // generate eod summary
  async generateEodSummary(tasks: Task[]): Promise<string> {
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 2000;

    // Serialize tasks properly as JSON string instead of [object Object]
    const tasksJson = JSON.stringify(tasks, null, 2);

    const finalPrompt = `${EOD_WORK_SUMMARY_PROMPT}\n\nUser Task Input:\n${tasksJson}\n\nReturn plain text summary only.`;
    const model = await getModel();

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await model.generateContent(finalPrompt);
        const text = result.response.text();
        if (!text || text.trim().length === 0) {
          throw new Error("Empty response from AI");
        }
        return text.trim();
      } catch (error: any) {
        const delay = getRetryDelay(error, attempt, RETRY_DELAY_MS);

        if (attempt === MAX_RETRIES || delay === null) {
          console.error(`AI generateEodSummary failed after ${attempt} attempts:`, error);
          throw new Error(getErrorMessage(error));
        }

        console.log(`AI Service error (attempt ${attempt}/${MAX_RETRIES}). Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error("Failed to generate EOD summary.");
  },
};
