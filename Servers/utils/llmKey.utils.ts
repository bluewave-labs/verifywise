import { QueryTypes, Transaction } from "sequelize";
import { sequelize } from "../database/db";
import { ILLMKey, LLMProvider } from "../domain.layer/interfaces/i.llmKey";
import { LLMKeyModel } from "../domain.layer/models/llmKey/llmKey.model";

/**
 * Masks an API key, showing only the last 4 characters
 * @param key - The API key to mask
 * @returns Masked key like "****...abcd"
 */
export const maskApiKey = (key: string): string => {
  if (!key || key.length < 4) return "****";
  return `****...${key.slice(-4)}`;
};

export const getLLMKeysQuery = async (tenant: string) => {
  const result = (await sequelize.query(
    `SELECT id, name, url, model, created_at FROM "${tenant}".llm_keys ORDER BY created_at DESC;`,
  )) as [LLMKeyModel[], number];
  return result[0];
};

/**
 * Gets LLM keys including the actual API key (for internal use only, e.g., advisor)
 * WARNING: This returns sensitive data - do not expose to API responses
 */
export const getLLMKeysWithKeyQuery = async (tenant: string) => {
  const result = (await sequelize.query(
    `SELECT id, name, url, model, key, created_at FROM "${tenant}".llm_keys ORDER BY created_at DESC;`,
  )) as [LLMKeyModel[], number];
  return result[0];
};

export const getLLMKeyQuery = async (tenant: string, name: string) => {
  const result = (await sequelize.query(
    `SELECT id, name, url, model, created_at FROM "${tenant}".llm_keys WHERE name = :name;`,
    {
      replacements: { name },
    },
  )) as [LLMKeyModel[], number];
  return result[0];
};

export const createLLMKeyQuery = async (
  data: ILLMKey,
  tenant: string,
  transaction: Transaction,
) => {
  // Exclude 'key' from RETURNING to prevent exposing API key in response
  const result = (await sequelize.query(
    `INSERT INTO "${tenant}".llm_keys (key, name, url, model) VALUES (:key, :name, :url, :model) RETURNING id, name, url, model, created_at;`,
    {
      replacements: {
        key: data.key,
        name: data.name,
        url: data.url,
        model: data.model,
      },
      transaction,
    },
  )) as [ILLMKey[], number];
  return result[0][0];
};

export const updateLLMKeyByIdQuery = async (
  id: number,
  data: Partial<LLMKeyModel>,
  tenant: string,
  transaction: Transaction,
): Promise<LLMKeyModel | null> => {
  const updateData: Partial<Record<keyof ILLMKey, any>> = {};
  const setClause = ["name", "key", "url", "model"]
    .filter((f) => {
      if (data[f as keyof ILLMKey] !== undefined && data[f as keyof ILLMKey]) {
        updateData[f as keyof ILLMKey] = data[f as keyof ILLMKey];
        return true;
      }
      return false;
    })
    .map((f) => `${f} = :${f}`)
    .join(", ");

  // Exclude 'key' from RETURNING to prevent exposing API key in response
  const query = `UPDATE "${tenant}".llm_keys SET ${setClause} WHERE id = :id RETURNING id, name, url, model, created_at;`;

  updateData.id = id;

  const result = await sequelize.query(query, {
    replacements: updateData,
    mapToModel: true,
    model: LLMKeyModel,
    transaction,
  });

  return result[0];
};

export const deleteLLMKeyQuery = async (id: number, tenant: string) => {
  const result = await sequelize.query(
    `DELETE FROM "${tenant}".llm_keys WHERE id = :id RETURNING *;`,
    {
      replacements: { id },
      mapToModel: true,
      model: LLMKeyModel,
      type: QueryTypes.DELETE,
    },
  );
  return result.length > 0;
};

export const getLLMProviderUrl = (provider: LLMProvider): string => {
  const urls: Record<LLMProvider, string> = {
    Anthropic: "https://api.anthropic.com/v1",
    OpenAI: "https://api.openai.com/v1/",
    OpenRouter: "https://openrouter.ai/api/v1/",
  };

  return urls[provider];
};

export const isValidLLMProvider = (
  provider: string,
): provider is LLMProvider => {
  return ["Anthropic", "OpenAI", "OpenRouter"].includes(provider);
};
