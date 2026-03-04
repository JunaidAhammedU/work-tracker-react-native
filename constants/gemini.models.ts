// Free tier Gemini text generation models available via the Gemini API
// Source: https://ai.google.dev/gemini-api/docs/models
// Note: Free tier has rate limits (RPM/RPD). Switch models to avoid hitting limits.

export interface GeminiModel {
    id: string;
    label: string;
    description: string;
    isFree: boolean;
}

export const GEMINI_MODELS: GeminiModel[] = [
    {
        id: "gemini-2.5-flash",
        label: "Gemini 2.5 Flash",
        description: "Best price-performance, low-latency with reasoning (Free)",
        isFree: true,
    },
    {
        id: "gemini-2.5-flash-lite",
        label: "Gemini 2.5 Flash-Lite",
        description: "Fastest & most budget-friendly in 2.5 family (Free)",
        isFree: true,
    },
    {
        id: "gemini-2.5-pro",
        label: "Gemini 2.5 Pro",
        description: "Most advanced for complex tasks & deep reasoning (Free trial)",
        isFree: true,
    },
    {
        id: "gemini-2.0-flash",
        label: "Gemini 2.0 Flash",
        description: "Next-gen features, 1M token context, superior speed (Free)",
        isFree: true,
    },
    {
        id: "gemini-2.0-flash-lite",
        label: "Gemini 2.0 Flash-Lite",
        description: "Fastest second-gen model, optimized for low latency (Free)",
        isFree: true,
    },
    {
        id: "gemini-1.5-flash",
        label: "Gemini 1.5 Flash",
        description: "Fast and versatile multimodal model (Free)",
        isFree: true,
    },
    {
        id: "gemini-1.5-flash-8b",
        label: "Gemini 1.5 Flash-8B",
        description: "Small model for high-volume, lower-intelligence tasks (Free)",
        isFree: true,
    },
    {
        id: "gemini-1.5-pro",
        label: "Gemini 1.5 Pro",
        description: "Mid-size multimodal model with 2M token context (Free trial)",
        isFree: true,
    },
];

export const DEFAULT_GEMINI_MODEL = "gemini-1.5-flash";
export const GEMINI_MODEL_STORAGE_KEY = "@selected_gemini_model";
