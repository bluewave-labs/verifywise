import React from "react";
import { useTheme } from "@mui/material";
import { PROVIDER_ICONS } from "../../components/ProviderIcons";

export const sectionTitleSx = { fontWeight: 600, fontSize: 16 };

export function useCardSx() {
  const theme = useTheme();
  return {
    background: theme.palette.background.paper,
    border: `1.5px solid ${theme.palette.border.light}`,
    borderRadius: theme.shape.borderRadius,
    p: theme.spacing(5, 6),
    boxShadow: "none",
  };
}

/**
 * Maps AI Gateway provider IDs (lowercase) to ProviderIcons keys.
 * Covers all top providers + common LiteLLM provider strings.
 */
const GATEWAY_PROVIDER_MAP: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  gemini: "Google",
  google: "Google",
  mistral: "Mistral",
  xai: "Groq",  // xAI uses Groq icon as closest match
  openrouter: "OpenRouter",
  bedrock: "Aws",
  azure: "Microsoft",
  azure_ai: "Microsoft",
  together_ai: "Together",
  cohere: "Cohere",
  groq: "Groq",
  deepseek: "DeepSeek",
  fireworks_ai: "Fireworks",
  replicate: "Replicate",
  perplexity: "Perplexity",
  ollama: "Ollama",
  huggingface: "HuggingFace",
  cerebras: "Cerebras",
  sambanova: "SambaNova",
  nvidia_nim: "Nvidia",
  meta_llama: "Meta",
  ai21: "Ai21",
  voyage: "Voyage",
  jina_ai: "Jina",
};

/**
 * Get the provider icon component for a gateway provider ID.
 * Returns null if no icon is available.
 */
export function getProviderIcon(provider: string): React.ComponentType<React.SVGProps<SVGSVGElement>> | null {
  const key = GATEWAY_PROVIDER_MAP[provider.toLowerCase()];
  return key ? PROVIDER_ICONS[key] || null : null;
}

/**
 * Render a provider icon with fallback.
 * Returns the SVG icon element or null if no match.
 */
export function ProviderIcon({ provider, size = 16 }: { provider: string; size?: number }) {
  const IconComponent = getProviderIcon(provider);
  if (!IconComponent) return null;
  return React.createElement(IconComponent, { width: size, height: size });
}
