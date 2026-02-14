import {
  EOD_WORK_SUMMARY_PROMPT,
  TASK_FORMAT_PROMPT,
} from "@/constants/task.ai.prompt";
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

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

export const aiService = {
  // send message to ai
  async sendMessage(userTask: string) {
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 1000;

    try {
      const finalPrompt = `
      ${TASK_FORMAT_PROMPT}
      User Task Input:
      ${userTask}
      Return JSON only.
      `;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const result = await model.generateContent(finalPrompt);
          return result.response.text();
        } catch (error: any) {
          const isServiceUnavailable =
            error.message?.includes("503") ||
            error.message?.includes("overloaded");

          if (attempt === MAX_RETRIES || !isServiceUnavailable) {
            throw error;
          }

          console.log(
            `AI Service 503 error. Retrying attempt \${attempt} in \${RETRY_DELAY_MS * attempt}ms...`,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, RETRY_DELAY_MS * attempt),
          );
        }
      }
    } catch (error) {
      // Add this line to see the real error in your terminal/console
      console.error("ORIGINAL ERROR DETAILS:", error);

      alert("AI Service is currently unavailable. Please try again later.");
      throw error; // Optional: Throw the original error instead of a new one to see the stack trace
    }
  },

  // generate eod summary.
  async generateEodSummary(tasks: Task[]) {
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 1000;

    try {
      const finalPrompt = `
      ${EOD_WORK_SUMMARY_PROMPT}
      User Task Input:
      ${tasks}
      Return JSON only.
      `;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const result = await model.generateContent(finalPrompt);
          return result.response.text();
        } catch (error: any) {
          const isServiceUnavailable =
            error.message?.includes("503") ||
            error.message?.includes("overloaded");

          if (attempt === MAX_RETRIES || !isServiceUnavailable) {
            throw error;
          }

          await new Promise((resolve) =>
            setTimeout(resolve, RETRY_DELAY_MS * attempt),
          );
        }
      }
    } catch (error) {
      alert("AI Service is currently unavailable. Please try again later.");
      throw new Error("Failed to fetch response from AI service.");
    }
  },
};
