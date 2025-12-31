/**
 * @fileoverview Cloud AI Provider Patterns
 *
 * Patterns for detecting cloud-based AI services that send data to external APIs.
 * These are HIGH RISK for data leakage.
 *
 * Pattern sources:
 * - TruffleHog: https://github.com/trufflesecurity/trufflehog
 * - Gitleaks: https://github.com/gitleaks/gitleaks
 *
 * @module lib/ai-detection/patterns/cloud-providers
 */

import type { DetectionPattern } from "../types";

export const CLOUD_PROVIDER_PATTERNS: DetectionPattern[] = [
  // ============================================================================
  // OpenAI
  // ============================================================================
  {
    name: "openai",
    provider: "OpenAI",
    description: "OpenAI API client for GPT, DALL-E, Whisper, and more",
    documentationUrl: "https://platform.openai.com/docs",
    confidence: "high",
    // Keywords for fast pre-filtering (from TruffleHog)
    keywords: [
      "T3BlbkFJ",      // Base64 encoded "OpenAI" marker in keys
      "sk-proj-",      // Project keys
      "sk-svcacct-",   // Service account keys
      "sk-admin-",     // Admin keys
      "openai",
      "OPENAI_API_KEY",
      "api.openai.com",
    ],
    patterns: {
      imports: [
        /^import\s+openai/m,
        /^from\s+openai\s+import/m,
        /require\s*\(\s*["']openai["']\s*\)/,
        /import\s+.*\s+from\s+["']openai["']/,
        /import\s+OpenAI\s+from/,
      ],
      dependencies: [
        /^openai[=<>~!\s@]/m,
        /"openai"\s*:/,
        /'openai'\s*:/,
      ],
      // Tiered API call detection (most reliable first)
      apiCalls: [
        // Tier 1: API URLs (MOST RELIABLE)
        /api\.openai\.com/,

        // Tier 2: SDK Client Instantiation
        /new\s+OpenAI\s*\(/,
        /OpenAI\s*\(\s*\)/,
        /openai\.OpenAI\s*\(/,

        // Tier 3: Provider-prefixed method calls
        /openai\.chat\.completions\.create\s*\(/,
        /openai\.completions\.create\s*\(/,
        /openai\.embeddings\.create\s*\(/,
        /openai\.images\.generate\s*\(/,
        /openai\.audio\.transcriptions\.create\s*\(/,
        /openai\.audio\.translations\.create\s*\(/,
        /openai\.moderations\.create\s*\(/,
        /openai\.files\.create\s*\(/,
        /openai\.fine_tuning\.jobs\.create\s*\(/,

        // Assistants API
        /openai\.beta\.assistants\./,
        /openai\.beta\.threads\./,
      ],
      // Secret patterns (from TruffleHog/Gitleaks)
      secrets: [
        // Standard API keys with T3BlbkFJ marker (base64 "OpenAI")
        /\bsk-[A-Za-z0-9_-]*T3BlbkFJ[A-Za-z0-9_-]*\b/,
        // Project keys (new format)
        /\bsk-proj-[A-Za-z0-9_-]{20,}\b/,
        // Service account keys
        /\bsk-svcacct-[A-Za-z0-9_-]{20,}\b/,
        // Admin keys
        /\bsk-admin-[A-Za-z0-9_-]{20,}\b/,
        // Environment variable assignments
        /OPENAI_API_KEY\s*[=:]\s*["']?[A-Za-z0-9_-]+["']?/,
      ],
    },
  },

  // ============================================================================
  // Anthropic
  // ============================================================================
  {
    name: "anthropic",
    provider: "Anthropic",
    description: "Anthropic API client for Claude models",
    documentationUrl: "https://docs.anthropic.com",
    confidence: "high",
    keywords: [
      "sk-ant-api03",
      "sk-ant-admin01",
      "anthropic",
      "ANTHROPIC_API_KEY",
      "api.anthropic.com",
      "claude",
    ],
    patterns: {
      imports: [
        /^import\s+anthropic/m,
        /^from\s+anthropic\s+import/m,
        /require\s*\(\s*["']@anthropic-ai\/sdk["']\s*\)/,
        /import\s+.*\s+from\s+["']@anthropic-ai\/sdk["']/,
        /import\s+Anthropic\s+from/,
      ],
      dependencies: [
        /^anthropic[=<>~!\s]/m,
        /"@anthropic-ai\/sdk"\s*:/,
        /'@anthropic-ai\/sdk'\s*:/,
      ],
      apiCalls: [
        // Tier 1: API URL
        /api\.anthropic\.com/,

        // Tier 2: SDK Client Instantiation
        /new\s+Anthropic\s*\(/,
        /Anthropic\s*\(\s*\)/,
        /anthropic\.Anthropic\s*\(/,

        // Tier 3: Provider-prefixed method calls
        /anthropic\.messages\.create\s*\(/,
        /anthropic\.messages\.stream\s*\(/,
        /anthropic\.completions\.create\s*\(/,
      ],
      // Secret patterns (from TruffleHog - exact format)
      secrets: [
        // API keys: exactly 93 chars + AA suffix
        /\bsk-ant-api03-[A-Za-z0-9_-]{93}AA\b/,
        // Admin keys
        /\bsk-ant-admin01-[A-Za-z0-9_-]{93}AA\b/,
        // Environment variable assignments
        /ANTHROPIC_API_KEY\s*[=:]\s*["']?[A-Za-z0-9_-]+["']?/,
        /CLAUDE_API_KEY\s*[=:]\s*["']?[A-Za-z0-9_-]+["']?/,
      ],
    },
  },

  // ============================================================================
  // Google AI (Gemini)
  // ============================================================================
  {
    name: "google-generativeai",
    provider: "Google",
    description: "Google Generative AI (Gemini) API client",
    documentationUrl: "https://ai.google.dev/docs",
    confidence: "high",
    keywords: [
      "AIza",           // Google API key prefix
      "generativeai",
      "gemini",
      "GOOGLE_API_KEY",
      "GEMINI_API_KEY",
      "generativelanguage.googleapis.com",
      "aiplatform.googleapis.com",
    ],
    patterns: {
      imports: [
        /^import\s+google\.generativeai/m,
        /^from\s+google\.generativeai\s+import/m,
        /^from\s+google\s+import\s+generativeai/m,
        /require\s*\(\s*["']@google\/generative-ai["']\s*\)/,
        /import\s+.*\s+from\s+["']@google\/generative-ai["']/,
      ],
      dependencies: [
        /^google-generativeai[=<>~!\s]/m,
        /"@google\/generative-ai"\s*:/,
        /'@google\/generative-ai'\s*:/,
      ],
      apiCalls: [
        // Tier 1: API URLs
        /generativelanguage\.googleapis\.com/,
        /aiplatform\.googleapis\.com/,

        // Tier 2: SDK instantiation
        /GenerativeModel\s*\(/,
        /genai\.GenerativeModel\s*\(/,

        // Tier 3: Method calls
        /model\.generate_content\s*\(/,
        /\.generate_content_async\s*\(/,
        /\.start_chat\s*\(/,
        /chat\.send_message\s*\(/,
      ],
      secrets: [
        // Google API keys (AIza prefix, 35 chars)
        /\bAIza[A-Za-z0-9_-]{35}\b/,
        // Environment variables
        /GOOGLE_API_KEY\s*[=:]\s*["']?[A-Za-z0-9_-]+["']?/,
        /GEMINI_API_KEY\s*[=:]\s*["']?[A-Za-z0-9_-]+["']?/,
      ],
    },
  },

  // ============================================================================
  // Azure OpenAI
  // ============================================================================
  {
    name: "azure-openai",
    provider: "Microsoft",
    description: "Azure OpenAI Service client",
    documentationUrl: "https://learn.microsoft.com/azure/ai-services/openai",
    confidence: "high",
    keywords: [
      "azure",
      "openai.azure.com",
      "AZURE_OPENAI",
      "AzureOpenAI",
    ],
    patterns: {
      imports: [
        /^from\s+openai\s+import\s+AzureOpenAI/m,
        /import\s+.*AzureOpenAI.*from\s+["']openai["']/,
        /require\s*\(\s*["']@azure\/openai["']\s*\)/,
      ],
      dependencies: [
        /"@azure\/openai"\s*:/,
        /'@azure\/openai'\s*:/,
      ],
      apiCalls: [
        // Tier 1: API URL
        /\.openai\.azure\.com/,

        // Tier 2: SDK instantiation
        /AzureOpenAI\s*\(/,
        /new\s+AzureOpenAI\s*\(/,

        // Tier 3: Method calls
        /\.get_chat_completions\s*\(/,
        /\.get_completions\s*\(/,
        /\.get_embeddings\s*\(/,
      ],
      secrets: [
        /AZURE_OPENAI_API_KEY\s*[=:]\s*["']?[A-Za-z0-9_-]+["']?/,
        /AZURE_OPENAI_KEY\s*[=:]\s*["']?[A-Za-z0-9_-]+["']?/,
        /AZURE_OPENAI_ENDPOINT\s*[=:]\s*["']?https?:\/\/[^"'\s]+["']?/,
      ],
    },
  },

  // ============================================================================
  // AWS Bedrock
  // ============================================================================
  {
    name: "aws-bedrock",
    provider: "AWS",
    description: "AWS Bedrock for accessing foundation models",
    documentationUrl: "https://docs.aws.amazon.com/bedrock",
    confidence: "high",
    keywords: [
      "bedrock",
      "AKIA",           // AWS Access Key prefix
      "ABSK",           // Bedrock API key prefix
      "amazonaws.com",
      "AWS_ACCESS_KEY",
      "AWS_SECRET",
    ],
    patterns: {
      imports: [
        /^import\s+boto3/m,
        /^from\s+boto3\s+import/m,
        /require\s*\(\s*["']@aws-sdk\/client-bedrock["']\s*\)/,
        /import\s+.*\s+from\s+["']@aws-sdk\/client-bedrock-runtime["']/,
      ],
      dependencies: [
        /"@aws-sdk\/client-bedrock-runtime"\s*:/,
        /'@aws-sdk\/client-bedrock-runtime'\s*:/,
        /^boto3[=<>~!\s]/m,
      ],
      apiCalls: [
        // Tier 1: API URL
        /bedrock-runtime\.[^.]+\.amazonaws\.com/,
        /bedrock\.[^.]+\.amazonaws\.com/,

        // Tier 2: SDK instantiation
        /BedrockRuntimeClient\s*\(/,
        /BedrockRuntime\s*\(/,
        /boto3\.client\s*\(\s*['"]bedrock-runtime['"]/,

        // Tier 3: Method calls
        /\.invoke_model\s*\(/,
        /\.invokeModel\s*\(/,
        /InvokeModelCommand\s*\(/,
        /InvokeModelWithResponseStreamCommand\s*\(/,
      ],
      secrets: [
        // AWS Access Key IDs
        /\bAKIA[A-Z0-9]{16}\b/,
        // Bedrock specific keys
        /\bABSK[A-Za-z0-9+\/]{109,269}={0,2}\b/,
        // Environment variables
        /AWS_ACCESS_KEY_ID\s*[=:]\s*["']?AKIA[A-Z0-9]{16}["']?/,
        /AWS_SECRET_ACCESS_KEY\s*[=:]\s*["']?[A-Za-z0-9\/+=]{40}["']?/,
      ],
    },
  },

  // ============================================================================
  // Cohere
  // ============================================================================
  {
    name: "cohere",
    provider: "Cohere",
    description: "Cohere API for NLP and embeddings",
    documentationUrl: "https://docs.cohere.com",
    confidence: "high",
    keywords: [
      "cohere",
      "COHERE_API_KEY",
      "api.cohere.ai",
      "api.cohere.com",
    ],
    minEntropy: 4.0, // Cohere keys need high entropy check
    patterns: {
      imports: [
        /^import\s+cohere/m,
        /^from\s+cohere\s+import/m,
        /require\s*\(\s*["']cohere-ai["']\s*\)/,
        /import\s+.*\s+from\s+["']cohere-ai["']/,
      ],
      dependencies: [
        /^cohere[=<>~!\s]/m,
        /"cohere-ai"\s*:/,
        /'cohere-ai'\s*:/,
      ],
      apiCalls: [
        // Tier 1: API URL
        /api\.cohere\.ai/,
        /api\.cohere\.com/,

        // Tier 2: SDK instantiation
        /cohere\.Client\s*\(/,
        /new\s+CohereClient\s*\(/,

        // Tier 3: Provider-prefixed method calls
        /cohere\.chat\s*\(/,
        /cohere\.generate\s*\(/,
        /cohere\.embed\s*\(/,
        /cohere\.rerank\s*\(/,
        /co\.chat\s*\(/,
        /co\.generate\s*\(/,
        /co\.embed\s*\(/,
      ],
      secrets: [
        /COHERE_API_KEY\s*[=:]\s*["']?[A-Za-z0-9_-]+["']?/,
      ],
    },
  },

  // ============================================================================
  // Mistral AI
  // ============================================================================
  {
    name: "mistralai",
    provider: "Mistral AI",
    description: "Mistral AI API client",
    documentationUrl: "https://docs.mistral.ai",
    confidence: "high",
    keywords: [
      "mistral",
      "MISTRAL_API_KEY",
      "api.mistral.ai",
    ],
    patterns: {
      imports: [
        /^import\s+mistralai/m,
        /^from\s+mistralai\s+import/m,
        /require\s*\(\s*["']@mistralai\/mistralai["']\s*\)/,
        /import\s+.*\s+from\s+["']@mistralai\/mistralai["']/,
      ],
      dependencies: [
        /^mistralai[=<>~!\s]/m,
        /"@mistralai\/mistralai"\s*:/,
        /'@mistralai\/mistralai'\s*:/,
      ],
      apiCalls: [
        // Tier 1: API URL
        /api\.mistral\.ai/,

        // Tier 2: SDK instantiation
        /MistralClient\s*\(/,
        /new\s+Mistral\s*\(/,
        /Mistral\s*\(\s*\)/,

        // Tier 3: Provider-prefixed method calls
        /mistral\.chat\s*\(/,
        /mistral\.chat\.complete\s*\(/,
        /mistral\.chat\.stream\s*\(/,
      ],
      secrets: [
        /MISTRAL_API_KEY\s*[=:]\s*["']?[A-Za-z0-9_-]+["']?/,
      ],
    },
  },

  // ============================================================================
  // Replicate
  // ============================================================================
  {
    name: "replicate",
    provider: "Replicate",
    description: "Replicate API for running ML models",
    documentationUrl: "https://replicate.com/docs",
    confidence: "high",
    keywords: [
      "replicate",
      "r8_",              // Replicate API token prefix
      "REPLICATE_API_TOKEN",
      "api.replicate.com",
    ],
    patterns: {
      imports: [
        /^import\s+replicate/m,
        /^from\s+replicate\s+import/m,
        /require\s*\(\s*["']replicate["']\s*\)/,
        /import\s+.*\s+from\s+["']replicate["']/,
      ],
      dependencies: [
        /^replicate[=<>~!\s]/m,
        /"replicate"\s*:/,
        /'replicate'\s*:/,
      ],
      apiCalls: [
        // Tier 1: API URL
        /api\.replicate\.com/,

        // Tier 2/3: Method calls
        /replicate\.run\s*\(/,
        /replicate\.predictions\.create\s*\(/,
        /replicate\.models\.get\s*\(/,
        /replicate\.stream\s*\(/,
      ],
      secrets: [
        // Replicate API tokens (r8_ prefix)
        /\br8_[A-Za-z0-9]{36,}\b/,
        /REPLICATE_API_TOKEN\s*[=:]\s*["']?[A-Za-z0-9_-]+["']?/,
      ],
    },
  },

  // ============================================================================
  // Hugging Face Inference
  // ============================================================================
  {
    name: "huggingface-inference",
    provider: "Hugging Face",
    description: "Hugging Face Inference API client",
    documentationUrl: "https://huggingface.co/docs/api-inference",
    confidence: "high",
    keywords: [
      "hf_",              // HF token prefix
      "api_org_",         // Org token prefix
      "huggingface",
      "HF_TOKEN",
      "HUGGINGFACE",
      "api-inference.huggingface.co",
    ],
    patterns: {
      imports: [
        /^from\s+huggingface_hub\s+import/m,
        /^import\s+huggingface_hub/m,
        /require\s*\(\s*["']@huggingface\/inference["']\s*\)/,
        /import\s+.*\s+from\s+["']@huggingface\/inference["']/,
      ],
      dependencies: [
        /^huggingface[-_]hub[=<>~!\s]/m,
        /"@huggingface\/inference"\s*:/,
        /'@huggingface\/inference'\s*:/,
      ],
      apiCalls: [
        // Tier 1: API URL
        /api-inference\.huggingface\.co/,

        // Tier 2: SDK instantiation
        /InferenceClient\s*\(/,
        /HfInference\s*\(/,

        // Tier 3: Method calls
        /inference_client\.text_generation\s*\(/,
        /\.text_generation\s*\(/,
        /\.chat_completion\s*\(/,
      ],
      secrets: [
        // Access tokens (hf_ prefix, 34 chars)
        /\bhf_[A-Za-z]{34}\b/,
        // Organization tokens
        /\bapi_org_[A-Za-z]{34}\b/,
        // Environment variables
        /HF_TOKEN\s*[=:]\s*["']?[A-Za-z0-9_-]+["']?/,
        /HUGGINGFACE_TOKEN\s*[=:]\s*["']?[A-Za-z0-9_-]+["']?/,
        /HUGGING_FACE_HUB_TOKEN\s*[=:]\s*["']?[A-Za-z0-9_-]+["']?/,
      ],
    },
  },

  // ============================================================================
  // Groq
  // ============================================================================
  {
    name: "groq",
    provider: "Groq",
    description: "Groq API for fast LLM inference",
    documentationUrl: "https://console.groq.com/docs",
    confidence: "high",
    keywords: [
      "groq",
      "gsk_",           // Groq API key prefix
      "GROQ_API_KEY",
      "api.groq.com",
    ],
    patterns: {
      imports: [
        /^import\s+groq/m,
        /^from\s+groq\s+import/m,
        /require\s*\(\s*["']groq-sdk["']\s*\)/,
        /import\s+.*\s+from\s+["']groq-sdk["']/,
      ],
      dependencies: [
        /^groq[=<>~!\s]/m,
        /"groq-sdk"\s*:/,
        /'groq-sdk'\s*:/,
      ],
      apiCalls: [
        // Tier 1: API URL
        /api\.groq\.com/,

        // Tier 2: SDK instantiation
        /Groq\s*\(\s*\)/,
        /new\s+Groq\s*\(/,

        // Tier 3: Method calls
        /groq\.chat\.completions\.create\s*\(/,
      ],
      secrets: [
        // Groq API keys (gsk_ prefix)
        /\bgsk_[A-Za-z0-9]{50,}\b/,
        /GROQ_API_KEY\s*[=:]\s*["']?[A-Za-z0-9_-]+["']?/,
      ],
    },
  },

  // ============================================================================
  // Together AI
  // ============================================================================
  {
    name: "together",
    provider: "Together AI",
    description: "Together AI platform for open-source models",
    documentationUrl: "https://docs.together.ai",
    confidence: "high",
    keywords: [
      "together",
      "TOGETHER_API_KEY",
      "api.together.xyz",
      "api.together.ai",
    ],
    patterns: {
      imports: [
        /^import\s+together/m,
        /^from\s+together\s+import/m,
        /require\s*\(\s*["']together-ai["']\s*\)/,
        /import\s+.*\s+from\s+["']together-ai["']/,
      ],
      dependencies: [
        /^together[=<>~!\s]/m,
        /"together-ai"\s*:/,
        /'together-ai'\s*:/,
      ],
      apiCalls: [
        // Tier 1: API URLs
        /api\.together\.xyz/,
        /api\.together\.ai/,

        // Tier 2: SDK instantiation
        /Together\s*\(\s*\)/,
        /new\s+Together\s*\(/,

        // Tier 3: Method calls
        /together\.chat\.completions\.create\s*\(/,
        /together\.Complete\.create\s*\(/,
      ],
      secrets: [
        /TOGETHER_API_KEY\s*[=:]\s*["']?[A-Za-z0-9_-]+["']?/,
      ],
    },
  },

  // ============================================================================
  // Perplexity
  // ============================================================================
  {
    name: "perplexity",
    provider: "Perplexity",
    description: "Perplexity AI API for search-augmented generation",
    documentationUrl: "https://docs.perplexity.ai",
    confidence: "high",
    keywords: [
      "perplexity",
      "pplx-",            // Perplexity API key prefix
      "PERPLEXITY_API_KEY",
      "api.perplexity.ai",
    ],
    patterns: {
      imports: [
        /^import\s+perplexity/m,
        /^from\s+perplexity\s+import/m,
      ],
      dependencies: [
        /^perplexity[=<>~!\s]/m,
      ],
      apiCalls: [
        // Tier 1: API URL
        /api\.perplexity\.ai/,

        // Tier 3: Method calls (uses OpenAI-compatible API)
        /perplexity\.chat\.completions\.create\s*\(/,
      ],
      secrets: [
        // Perplexity API keys (pplx- prefix, 48 chars)
        /\bpplx-[A-Za-z0-9]{48}\b/,
        /PERPLEXITY_API_KEY\s*[=:]\s*["']?[A-Za-z0-9_-]+["']?/,
      ],
    },
  },

  // ============================================================================
  // Fireworks AI
  // ============================================================================
  {
    name: "fireworks-ai",
    provider: "Fireworks AI",
    description: "Fireworks AI inference platform",
    documentationUrl: "https://docs.fireworks.ai",
    confidence: "high",
    keywords: [
      "fireworks",
      "FIREWORKS_API_KEY",
      "api.fireworks.ai",
    ],
    patterns: {
      imports: [
        /^import\s+fireworks/m,
        /^from\s+fireworks\s+import/m,
      ],
      dependencies: [
        /^fireworks-ai[=<>~!\s]/m,
        /"fireworks-ai"\s*:/,
        /'fireworks-ai'\s*:/,
      ],
      apiCalls: [
        // Tier 1: API URL
        /api\.fireworks\.ai/,

        // Tier 2: SDK instantiation
        /Fireworks\s*\(/,
        /fireworks\.client\s*\(/,
      ],
      secrets: [
        /FIREWORKS_API_KEY\s*[=:]\s*["']?[A-Za-z0-9_-]+["']?/,
      ],
    },
  },

  // ============================================================================
  // DeepSeek
  // ============================================================================
  {
    name: "deepseek",
    provider: "DeepSeek",
    description: "DeepSeek AI API",
    documentationUrl: "https://platform.deepseek.com/docs",
    confidence: "high",
    keywords: [
      "deepseek",
      "DEEPSEEK_API_KEY",
      "api.deepseek.com",
    ],
    patterns: {
      imports: [
        /^import\s+deepseek/m,
        /^from\s+deepseek\s+import/m,
      ],
      dependencies: [
        /^deepseek[=<>~!\s]/m,
      ],
      apiCalls: [
        // Tier 1: API URL
        /api\.deepseek\.com/,
      ],
      secrets: [
        /DEEPSEEK_API_KEY\s*[=:]\s*["']?[A-Za-z0-9_-]+["']?/,
      ],
    },
  },

  // ============================================================================
  // AI21 Labs
  // ============================================================================
  {
    name: "ai21",
    provider: "AI21 Labs",
    description: "AI21 Labs Jurassic models API",
    documentationUrl: "https://docs.ai21.com",
    confidence: "high",
    keywords: [
      "ai21",
      "AI21_API_KEY",
      "api.ai21.com",
    ],
    patterns: {
      imports: [
        /^import\s+ai21/m,
        /^from\s+ai21\s+import/m,
      ],
      dependencies: [
        /^ai21[=<>~!\s]/m,
        /"ai21"\s*:/,
        /'ai21'\s*:/,
      ],
      apiCalls: [
        // Tier 1: API URL
        /api\.ai21\.com/,
      ],
      secrets: [
        /AI21_API_KEY\s*[=:]\s*["']?[A-Za-z0-9_-]+["']?/,
      ],
    },
  },

  // ============================================================================
  // Cerebras
  // ============================================================================
  {
    name: "cerebras",
    provider: "Cerebras",
    description: "Cerebras fast inference API",
    documentationUrl: "https://docs.cerebras.ai",
    confidence: "high",
    keywords: [
      "cerebras",
      "CEREBRAS_API_KEY",
      "api.cerebras.ai",
    ],
    patterns: {
      imports: [
        /^import\s+cerebras/m,
        /^from\s+cerebras\s+import/m,
      ],
      dependencies: [
        /^cerebras-cloud-sdk[=<>~!\s]/m,
      ],
      apiCalls: [
        // Tier 1: API URL
        /api\.cerebras\.ai/,
      ],
      secrets: [
        /CEREBRAS_API_KEY\s*[=:]\s*["']?[A-Za-z0-9_-]+["']?/,
      ],
    },
  },
];
