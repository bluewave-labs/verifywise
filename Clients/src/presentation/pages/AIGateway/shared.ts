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

// ─── Shared constants ─────────────────────────────────────────────────────────

/** Top LLM providers for Select dropdowns */
export const TOP_PROVIDERS = [
  { _id: "openai", name: "OpenAI" },
  { _id: "anthropic", name: "Anthropic" },
  { _id: "gemini", name: "Google Gemini" },
  { _id: "mistral", name: "Mistral" },
  { _id: "xai", name: "xAI" },
  { _id: "openrouter", name: "OpenRouter" },
  { _id: "bedrock", name: "AWS Bedrock" },
  { _id: "azure", name: "Azure OpenAI" },
  { _id: "together_ai", name: "Together AI" },
  { _id: "cohere", name: "Cohere" },
];

/** Model options for endpoint creation (provider/model format) */
export const MODEL_OPTIONS = [
  { id: "openai/gpt-4o", provider: "openai" },
  { id: "openai/gpt-4o-mini", provider: "openai" },
  { id: "openai/gpt-4.1", provider: "openai" },
  { id: "openai/gpt-4.1-mini", provider: "openai" },
  { id: "openai/gpt-4.1-nano", provider: "openai" },
  { id: "openai/o3", provider: "openai" },
  { id: "openai/o3-mini", provider: "openai" },
  { id: "openai/o4-mini", provider: "openai" },
  { id: "anthropic/claude-opus-4-20250514", provider: "anthropic" },
  { id: "anthropic/claude-sonnet-4-20250514", provider: "anthropic" },
  { id: "anthropic/claude-haiku-4-20250414", provider: "anthropic" },
  { id: "anthropic/claude-3.5-sonnet-20240620", provider: "anthropic" },
  { id: "gemini/gemini-2.5-pro-preview-06-05", provider: "gemini" },
  { id: "gemini/gemini-2.5-flash-preview-05-20", provider: "gemini" },
  { id: "gemini/gemini-2.0-flash", provider: "gemini" },
  { id: "mistral/mistral-large-latest", provider: "mistral" },
  { id: "mistral/mistral-medium-latest", provider: "mistral" },
  { id: "mistral/mistral-small-latest", provider: "mistral" },
  { id: "xai/grok-3", provider: "xai" },
  { id: "xai/grok-3-mini", provider: "xai" },
  { id: "bedrock/anthropic.claude-sonnet-4-20250514-v1:0", provider: "bedrock" },
  { id: "bedrock/anthropic.claude-3-5-sonnet-20240620-v1:0", provider: "bedrock" },
  { id: "bedrock/amazon.nova-pro-v1:0", provider: "bedrock" },
  { id: "together_ai/meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo", provider: "together_ai" },
  { id: "together_ai/meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo", provider: "together_ai" },
  { id: "openrouter/openai/gpt-4o", provider: "openrouter" },
  { id: "openrouter/anthropic/claude-sonnet-4", provider: "openrouter" },
].sort((a, b) => a.provider.localeCompare(b.provider));

/** Select-compatible model items */
export const MODEL_SELECT_ITEMS = MODEL_OPTIONS.map((m) => ({ _id: m.id, name: m.id }));

/** Divider positions between provider groups in the model Select */
export const MODEL_DIVIDERS: { index: number; label: string }[] = (() => {
  const dividers: { index: number; label: string }[] = [];
  let prev = "";
  MODEL_OPTIONS.forEach((m, i) => {
    if (m.provider !== prev && i > 0) {
      dividers.push({ index: i, label: m.provider.toUpperCase() });
    }
    prev = m.provider;
  });
  return dividers;
})();

/** Convert a display name to a URL-safe slug */
export function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Gateway base URL for code examples */
export const GATEWAY_URL = (() => {
  const apiUrl = (import.meta as any)?.env?.VITE_APP_API_URL as string | undefined;
  if (apiUrl) return apiUrl.replace(/\/api\/?$/, "");
  if (typeof window !== "undefined") return window.location.origin.replace(/:\d+$/, ":3000");
  return "https://your-verifywise-host";
})();

/** Color constants for code blocks and warning banners */
export const CODE_BLOCK_BG = "#1E1E1E";
export const CODE_BLOCK_TEXT = "#D4D4D4";
export const WARNING_BG = "#FFFAEB";
export const WARNING_BORDER = "#FEDF89";
export const WARNING_TEXT = "#B54708";
export const KEY_DISPLAY_BG = "#F9FAFB";
