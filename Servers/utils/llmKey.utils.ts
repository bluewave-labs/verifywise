import { QueryTypes, Transaction } from "sequelize";
import { sequelize } from "../database/db";
import { ValidationException } from "../domain.layer/exceptions/custom.exception";
import { ILLMKey } from "../domain.layer/interfaces/i.llmKey";
import { LLMKeyModel } from "../domain.layer/models/llmKey/llmKey.model";

export const getLLMKeysQuery = async (
  tenant: string
) => {
  const result = await sequelize.query(
    `SELECT * FROM "${tenant}".llm_keys ORDER BY created_at DESC;`,) as [LLMKeyModel[], number];
  return result[0];
}

export const getLLMKeyQuery = async (
  tenant: string,
  name: string
) => {
  const result = await sequelize.query(
    `SELECT * FROM "${tenant}".llm_keys WHERE name = :name;`, {
    replacements: { name },
    }) as [LLMKeyModel[], number];
  return result[0];
}

export const createLLMKeyQuery = async (
  data: ILLMKey,
  tenant: string,
  transaction: Transaction
) => {
  // Check if a LLM key with this name already exists
  const llmKey = await sequelize.query(
    `SELECT id FROM "${tenant}".llm_keys WHERE name = :name;`,
    {
      replacements: { name: data.name },
      transaction
    }
  ) as [{ id: number }[], number];

  if (llmKey[0].length > 0) {
    throw new ValidationException("A key with this name already exists. Please use a different name.");
  }

  const result = await sequelize.query(
    `INSERT INTO "${tenant}".llm_keys (key, name, url, model) VALUES (:key, :name, :url, :model) RETURNING *;`, {
    replacements: {
      key: data.key,
      name: data.name,
      url: data.url,
      model: data.model,
    },
    transaction
  }) as [ILLMKey[], number];
  return result[0][0];
}

export const updateLLMKeyByIdQuery = async (
  id: number,
  data: Partial<LLMKeyModel>,
  tenant: string,
  transaction: Transaction
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

  const query = `UPDATE "${tenant}".llm_keys SET ${setClause} WHERE id = :id RETURNING *;`;

  updateData.id = id;

  const result = await sequelize.query(query, {
    replacements: updateData,
    mapToModel: true,
    model: LLMKeyModel,
    transaction,
  });

  return result[0];
};

export const deleteLLMKeyQuery = async (
  id: number,
  tenant: string
) => {
  const result = await sequelize.query(
    `DELETE FROM "${tenant}".llm_keys WHERE id = :id RETURNING *;`, {
    replacements: { id },
    mapToModel: true,
    model: LLMKeyModel,
    type: QueryTypes.DELETE
  });
  return result.length > 0;
}