import { Transaction } from "sequelize";
import { createEUFrameworkQuery, deleteProjectFrameworkEUQuery } from "../utils/eu.utils";
import { createISOFrameworkQuery, deleteProjectFrameworkISOQuery } from "../utils/iso42001.utils";
import { createISO27001FrameworkQuery, deleteProjectFrameworkISO27001Query } from "../utils/iso27001.utils";

export const frameworkAdditionMap: Record<number, (
  projectId: number,
  enable_ai_data_insertion: boolean,
  tenant: string,
  transaction: Transaction
) => Promise<Object>> = {
  1: createEUFrameworkQuery,
  2: createISOFrameworkQuery,
  3: createISO27001FrameworkQuery
};

export const frameworkDeletionMap: Record<number, (id: number, tenant: string, transaction: Transaction) => Promise<boolean>> = {
  1: deleteProjectFrameworkEUQuery,
  2: deleteProjectFrameworkISOQuery,
  3: deleteProjectFrameworkISO27001Query
};

export const frameworkFilesDeletionSourceMap: Record<number, string[]> = {
  1: ["Assessment tracker group", "Compliance tracker group"],
  2: ["Management system clauses group", "Reference controls group"],
  3: ["Main clauses group", "Annex controls group"]
}
