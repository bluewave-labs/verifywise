export type LLMProvider = "Anthropic" | "OpenAI" | "OpenRouter" | "Custom";
export interface ILLMKey {
  id?: number;
  key: string;
  name: LLMProvider;
  url?: string | null;
  model: string;
  custom_headers?: Record<string, string> | null;
  created_at?: Date;
}
