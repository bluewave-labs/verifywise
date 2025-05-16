import { Transaction } from "sequelize";
import { createEUFrameworkQuery, deleteProjectFrameworkEUQuery } from "../utils/eu.utils";
import { createISOFrameworkQuery, deleteProjectFrameworkISOQuery } from "../utils/iso42001.utils";

export const frameworkAdditionMap: Record<number, (
  projectId: number,
  enable_ai_data_insertion: boolean,
  transaction: Transaction
) => Promise<Object>> = {
  1: createEUFrameworkQuery,
  2: createISOFrameworkQuery,
};

export const frameworkDeletionMap: Record<number, (id: number, transaction: Transaction) => Promise<boolean>> = {
  1: deleteProjectFrameworkEUQuery,
  2: deleteProjectFrameworkISOQuery,
};
