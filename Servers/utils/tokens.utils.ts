import { QueryTypes, Transaction } from "sequelize";
import { sequelize } from "../database/db";
import { IToken } from "../domain.layer/interfaces/i.tokens";
import { TokenModel } from "../domain.layer/models/tokens/tokens.model";
import { ValidationException } from "../domain.layer/exceptions/custom.exception";

export const getNumberOfApiTokensQuery = async (
  tenant: string,
) => {
  const numberOfTokens = await sequelize.query(
    `SELECT COUNT(*) FROM "${tenant}".api_tokens;`
  ) as [{ count: string }[], number];
  return parseInt(numberOfTokens[0][0].count, 10);
}

export const createApiTokenQuery = async (
  tokenPayload: IToken,
  tenant: string,
  transaction: Transaction
) => {
  const result = await sequelize.query(
    `INSERT INTO "${tenant}".api_tokens (
      token, name, expires_at, created_by
    ) VALUES (
      :token, :name, :expires_at, :created_by
    ) RETURNING *;`, {
    replacements: {
      token: tokenPayload.token,
      name: tokenPayload.name,
      expires_at: tokenPayload.expires_at,
      created_by: tokenPayload.created_by,
    },
    transaction
  }) as [IToken[], number];
  return result[0][0];
}

export const getApiTokensQuery = async (
  tenant: string
) => {
  const result = await sequelize.query(
    `SELECT id, name, expires_at, created_by, created_at FROM "${tenant}".api_tokens ORDER BY created_at DESC;`,) as [TokenModel[], number];
  return result[0];
}

export const deleteApiTokenQuery = async (
  id: number,
  tenant: string
) => {
  const result = await sequelize.query(
    `DELETE FROM "${tenant}".api_tokens WHERE id = :id RETURNING *;`, {
    replacements: { id },
    mapToModel: true,
    model: TokenModel,
    type: QueryTypes.DELETE
  });
  return result.length > 0;
}