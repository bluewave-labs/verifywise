import { ClauseStructISOModel } from '../../models/ISO-42001/clauseStructISO.model';
import { SubClauseStructISO } from '../../models/ISO-42001/subClauseStructISO.model';
import { getClausesReportQuery } from '../../utils/reporting.utils';
import { ReportBodyData } from '../reportService';

type SubClauses = SubClauseStructISO & {
  implementation_description: string;
};

type AllClauses = ClauseStructISOModel & {
  subClauses: SubClauses[];
};

export async function getClausesMarkdown(
  frameworkId: number,
  data: ReportBodyData
): Promise<string> {
  let rows: string = ``;
  try {
    const reportData = await getClausesReportQuery(frameworkId) as AllClauses[];
    rows =
      reportData.length > 0
        ? reportData
            .map((clause) => {
              const subClauses = clause.subClauses
                .map((subClause, i) => {
                  return `  - ${clause.clause_no}.${i + 1} ${subClause.title} <br> Implementation Description: ${subClause.implementation_description} \n`;
                })
                .join("\n");

              return `__${clause.title}__\n
  ${subClauses}\n`;
            })
            .join("\n")
        : `-`;
  } catch (error) {
    console.error(error);
    throw new Error(`Error while fetching the clauses data`); 
  }
  return rows
}