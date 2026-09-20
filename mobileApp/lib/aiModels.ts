export type AiProvider = "openai" | "gemini";
// What the backend switch expects (case "gpt" / case "gemini").
export type ApiProvider = "gpt" | "gemini";

export type AiModel = {
  id: string; // e.g. "gpt-4o-mini"
  label: string; // e.g. "GPT-4o mini"
  hint?: string; // e.g. "Fast · lower cost"
  provider: AiProvider;
  apiProvider: ApiProvider;
};

export type AiModelGroup = {
  provider: AiProvider;
  label: string; // "OpenAI" / "Gemini"
  models: AiModel[];
};

export const AI_MODEL_GROUPS: AiModelGroup[] = [
  {
    provider: "openai",
    label: "OpenAI",
    models: [
      {
        id: "gpt-4o-mini",
        label: "GPT-4o mini",
        hint: "Fast · lower cost",
        provider: "openai",
        apiProvider: "gpt",
      },
      {
        id: "gpt-4o",
        label: "GPT-4o",
        hint: "Most capable",
        provider: "openai",
        apiProvider: "gpt",
      },
    ],
  },
  {
    provider: "gemini",
    label: "Gemini",
    models: [
      {
        id: "gemini-3.6-flash",
        label: "Gemini 3.6 Flash",
        hint: "Fast",
        provider: "gemini",
        apiProvider: "gemini",
      },
      {
        id: "gemini-3.7-flash",
        label: "Gemini 3.7 Flash",
        hint: "Latest · fast",
        provider: "gemini",
        apiProvider: "gemini",
      },
      {
        id: "gemini-3-pro",
        label: "Gemini 3 Pro",
        hint: "Advanced reasoning",
        provider: "gemini",
        apiProvider: "gemini",
      },
    ],
  },
];

export const DEFAULT_MODEL_ID = "gpt-4o-mini";

export const findModel = (id: string): AiModel =>
  AI_MODEL_GROUPS.flatMap((g) => g.models).find((m) => m.id === id) ??
  AI_MODEL_GROUPS[0].models[0];
