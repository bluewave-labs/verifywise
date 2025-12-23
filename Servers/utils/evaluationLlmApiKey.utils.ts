/**
 * Evaluation LLM API Key Utils
 *
 * Database utilities for managing LLM provider API keys used in evaluations.
 * Uses raw SQL queries for consistency with other models.
 */

import { sequelize } from '../database/db';
import { Transaction } from 'sequelize';
import { encrypt, decrypt, maskApiKey } from './encryption.utils';
import { ValidationException } from '../domain.layer/exceptions/custom.exception';
import { LLMProvider, VALID_PROVIDERS } from '../domain.layer/models/evaluationLlmApiKey/evaluationLlmApiKey.model';
import { IEvaluationLlmApiKey, IMaskedKey } from '../domain.layer/interfaces/i.evalutationLlmApiKey';

/**
 * API key format patterns for each provider
 * Used to validate that the user entered a valid-looking API key
 */
const API_KEY_PATTERNS: Record<LLMProvider, { pattern: RegExp; example: string; description: string }> = {
  openai: {
    pattern: /^sk-(proj-)?[a-zA-Z0-9_-]{20,}$/,
    example: 'sk-... or sk-proj-...',
    description: 'OpenAI keys start with "sk-" or "sk-proj-"',
  },
  anthropic: {
    pattern: /^sk-ant-(api\d+-)?[a-zA-Z0-9_-]{20,}$/,
    example: 'sk-ant-api03-...',
    description: 'Anthropic keys start with "sk-ant-" (typically "sk-ant-api03-")',
  },
  google: {
    pattern: /^AIza[a-zA-Z0-9_-]{35,}$/,
    example: 'AIza...',
    description: 'Google API keys start with "AIza"',
  },
  xai: {
    pattern: /^xai-[a-zA-Z0-9_-]{20,}$/,
    example: 'xai-...',
    description: 'xAI keys start with "xai-"',
  },
  mistral: {
    pattern: /^[a-zA-Z0-9]{32,}$/,
    example: '32+ character alphanumeric string',
    description: 'Mistral keys are alphanumeric strings (32+ characters)',
  },
  huggingface: {
    pattern: /^hf_[a-zA-Z0-9]{20,}$/,
    example: 'hf_...',
    description: 'Hugging Face keys start with "hf_"',
  },
  openrouter: {
    pattern: /^sk-or-v1-[a-zA-Z0-9]{40,}$/,
    example: 'sk-or-v1-...',
    description: 'OpenRouter keys start with "sk-or-v1-"',
  },
};

/**
 * Validate API key format for a specific provider
 * @returns null if valid, or error message if invalid
 */
function validateApiKeyFormat(provider: LLMProvider, apiKey: string): string | null {
  const config = API_KEY_PATTERNS[provider];
  if (!config) {
    return null; // Unknown provider, skip format validation
  }

  const trimmedKey = apiKey.trim();

  if (!config.pattern.test(trimmedKey)) {
    return `Invalid ${provider} API key format. ${config.description}. Expected format: ${config.example}`;
  }

  return null; // Valid
}

/**
 * Validate provider is supported
 */
function validateProvider(provider: string): void {
  if (!VALID_PROVIDERS.includes(provider as LLMProvider)) {
    throw new ValidationException(
      `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}`,
      'provider',
      provider
    );
  }
}

/**
 * Get all API keys for an organization (returns masked keys)
 *
 * @param tenant - Tenant schema name
 * @returns Array of masked API keys
 */
export const getAllKeysForOrganizationQuery = async (
  tenant: string,
): Promise<IMaskedKey[]> => {
  const keys = await sequelize.query(
    `SELECT id, provider, encrypted_api_key, created_at, updated_at
     FROM "${tenant}".evaluation_llm_api_keys
     ORDER BY created_at DESC`,
  ) as [IEvaluationLlmApiKey[], number];

  // Decrypt and mask keys
  return keys[0].map(key => {
    let maskedKey = '***';
    try {
      if (key.encrypted_api_key) {
        const plainKey = decrypt(key.encrypted_api_key);
        maskedKey = maskApiKey(plainKey);
      }
    } catch (err) {
      console.warn(`Failed to decrypt key for provider ${key.provider}:`, err);
    }

    return {
      provider: key.provider,
      maskedKey,
      createdAt: key.created_at,
      updatedAt: key.updated_at,
    };
  });
};

/**
 * Create a new LLM API key entry
 *
 * @param tenant - Tenant schema name
 * @param provider - LLM provider name
 * @param apiKey - Plain text API key (will be encrypted)
 * @param transaction - Optional transaction
 * @returns Created key data
 */
export const createKeyQuery = async (
  tenant: string,
  provider: LLMProvider,
  apiKey: string,
  transaction: Transaction
): Promise<IMaskedKey> => {
  // Validate inputs
  validateProvider(provider);

  if (!apiKey || apiKey.trim().length === 0) {
    throw new ValidationException('API key cannot be empty', 'apiKey', apiKey);
  }

  // Validate API key format
  const formatError = validateApiKeyFormat(provider, apiKey);
  if (formatError) {
    throw new ValidationException(formatError, 'apiKey', apiKey);
  }

  // Check if key already exists for this provider
  const existing = await sequelize.query(
    `SELECT id FROM "${tenant}".evaluation_llm_api_keys WHERE provider = :provider`,
    {
      replacements: { provider },
      transaction,
    }
  ) as [IEvaluationLlmApiKey[], number];

  if (existing[0].length > 0) {
    throw new ValidationException(
      `API key for provider '${provider}' already exists. Delete it first to add a new one.`,
      'provider',
      provider
    );
  }

  // Encrypt the API key
  const encryptedKey = encrypt(apiKey.trim());

  // Insert new key
  const result = await sequelize.query(
    `INSERT INTO "${tenant}".evaluation_llm_api_keys (provider, encrypted_api_key)
     VALUES (:provider, :encrypted_api_key)
     RETURNING id, provider, encrypted_api_key, created_at, updated_at`,
    {
      replacements: {
        provider,
        encrypted_api_key: encryptedKey,
      },
      transaction,
    }
  ) as [IEvaluationLlmApiKey[], number];

  const createdKey = result[0][0];

  return {
    provider: createdKey.provider,
    maskedKey: maskApiKey(apiKey.trim()),
    createdAt: createdKey.created_at,
    updatedAt: createdKey.updated_at,
  };
};

/**
 * Get all decrypted LLM API keys for evaluations (internal use only)
 *
 * This returns the actual decrypted API keys for use by the evaluation server.
 * Should only be accessible from internal services.
 *
 * @param tenant - Tenant schema name
 * @param transaction - Optional transaction
 * @returns Map of provider -> decrypted API key
 */
export const getDecryptedKeysForOrganizationQuery = async (
  tenant: string,
): Promise<Record<string, string>> => {
  const keys = await sequelize.query(
    `SELECT provider, encrypted_api_key FROM "${tenant}".evaluation_llm_api_keys`
  ) as [IEvaluationLlmApiKey[], number];

  // Build map of provider -> decrypted key
  const decryptedKeys: Record<string, string> = {};
  for (const key of keys[0]) {
    try {
      if (key.encrypted_api_key) {
        decryptedKeys[key.provider] = decrypt(key.encrypted_api_key);
      }
    } catch (err) {
      console.warn(`Failed to decrypt key for provider ${key.provider}:`, err);
    }
  }

  return decryptedKeys;
};

/**
 * Delete an LLM API key
 *
 * @param tenant - Tenant schema name
 * @param provider - LLM provider name
 * @param transaction - Optional transaction
 * @returns True if deleted, false if not found
 */
export const deleteKeyQuery = async (
  tenant: string,
  provider: LLMProvider,
): Promise<boolean> => {
  validateProvider(provider);

  const result = await sequelize.query(
    `DELETE FROM "${tenant}".evaluation_llm_api_keys
     WHERE provider = :provider
     RETURNING id`,
    {
      replacements: { provider }
    }
  ) as [IEvaluationLlmApiKey[], number];

  return (result[0] as any[]).length > 0;
};

/**
 * Get decrypted API key for a specific provider
 *
 * @param tenant - Tenant schema name
 * @param provider - LLM provider name
 * @param transaction - Optional transaction
 * @returns Decrypted API key or null if not found
 */
export const getDecryptedKeyForProviderQuery = async (
  tenant: string,
  provider: LLMProvider,
  transaction: Transaction
): Promise<string | null> => {
  validateProvider(provider);

  const result = await sequelize.query(
    `SELECT encrypted_api_key FROM "${tenant}".evaluation_llm_api_keys WHERE provider = :provider`,
    {
      replacements: { provider },
      transaction,
    }
  ) as [IEvaluationLlmApiKey[], number];

  if (result[0].length === 0 || !result[0][0].encrypted_api_key) {
    return null;
  }

  try {
    return decrypt(result[0][0].encrypted_api_key);
  } catch (err) {
    console.error(`Failed to decrypt key for provider ${provider}:`, err);
    return null;
  }
};
