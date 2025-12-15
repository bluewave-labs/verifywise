export type LLMProvider = "Anthropic" | "OpenAI" | "OpenRouter";
export interface ILLMKey {
  id?: number;
  key: string;
  name: LLMProvider;
  url?: string | null;
  model: string;
  created_at?: Date;
}
