/**
 * @file tiers.util.ts
 * @description This file contains utility functions for performing CRUD operations on the 'tiers' table in the database.
 *
 * The functions included are:
 * - `getAllTiersQuery`: Fetches all tiers from the database, ordered by ID in ascending order.
 * - `getTiersFeaturesQuery`: Fetches features of a specific tier by its ID.
 *
 * Each function interacts with the database using SQL queries and returns the result.
 * The functions support database transactions for data consistency and integrity.
 *
 * @module utils/tiers.util
 */

import { TiersModel } from "../domain.layer/models/tiers/tiers.model";
import { ITiers, TierFeatures } from "../domain.layer/interfaces/i.tiers";
import { sequelize } from "../database/db";
import { Transaction } from "sequelize";

export const getAllTiersQuery = async(transaction: Transaction): Promise<ITiers[]> => {
  const tiers = await sequelize.query(
    `SELECT * FROM tiers ORDER BY id ASC`,
    {
      mapToModel: true,
      model: TiersModel,
      ...(transaction && { transaction }),
    }
  );
  return tiers;
};

export const getTiersFeaturesQuery = async (id: number): Promise<TierFeatures> => {
  const tiersFeatures = await sequelize.query(
    `SELECT * FROM tiers WHERE id = :id`,
    {
      replacements: { id },
      mapToModel: true,
      model: TiersModel,
    }
  );
  return tiersFeatures[0].dataValues.features;
};