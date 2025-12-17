import openaiModels from "./openai/models.json";
import anthropicModels from "./anthropic/models.json";
import googleModels from "./google/models.json";
import mistralModels from "./mistral/models.json";
import xaiModels from "./xai/models.json";

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  inputCost?: number;  // Cost per 1M input tokens in USD
  outputCost?: number; // Cost per 1M output tokens in USD
}

export interface ProviderConfig {
  provider: string;
  displayName: string;
  iconColor: string;
  logo: string;
  models: ModelInfo[];
}

// Provider metadata with icons/colors
const PROVIDER_META: Record<string, { displayName: string; iconColor: string; logo: string }> = {
  openai: { displayName: "OpenAI", iconColor: "#10A37F", logo: "/src/presentation/assets/icons/openai_logo.svg" },
  anthropic: { displayName: "Anthropic", iconColor: "#D97706", logo: "/src/presentation/assets/icons/anthropic_logo.svg" },
  google: { displayName: "Google", iconColor: "#4285F4", logo: "/src/presentation/assets/icons/gemini_logo.svg" },
  mistral: { displayName: "Mistral", iconColor: "#FF7000", logo: "/src/presentation/assets/icons/mistral_logo.svg" },
  xai: { displayName: "xAI", iconColor: "#000000", logo: "/src/presentation/assets/icons/xai_logo.svg" },
};

export const PROVIDERS: Record<string, ProviderConfig> = {
  openai: { 
    ...(openaiModels as { provider: string; displayName: string; models: ModelInfo[] }), 
    ...PROVIDER_META.openai 
  },
  anthropic: { 
    ...(anthropicModels as { provider: string; displayName: string; models: ModelInfo[] }), 
    ...PROVIDER_META.anthropic 
  },
  google: { 
    ...(googleModels as { provider: string; displayName: string; models: ModelInfo[] }), 
    ...PROVIDER_META.google 
  },
  mistral: { 
    ...(mistralModels as { provider: string; displayName: string; models: ModelInfo[] }), 
    ...PROVIDER_META.mistral 
  },
  xai: { 
    ...(xaiModels as { provider: string; displayName: string; models: ModelInfo[] }), 
    ...PROVIDER_META.xai 
  },
};

export const getProviderList = (): ProviderConfig[] => Object.values(PROVIDERS);

export const getModelsForProvider = (providerId: string): ModelInfo[] => {
  return PROVIDERS[providerId]?.models || [];
};

export const getProviderMeta = (providerId: string) => PROVIDER_META[providerId];

