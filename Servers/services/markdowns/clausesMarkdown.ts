import { ClauseStructISOModel } from "../../domain.layer/frameworks/ISO-42001/clauseStructISO.model";
import { SubClauseStructISO } from "../../domain.layer/frameworks/ISO-42001/subClauseStructISO.model";
import { getClausesReportQuery } from "../../utils/reporting.utils";
import { ReportBodyData } from "../reportService";

type SubClauses = SubClauseStructISO & {
  implementation_description: string;
};

type AllClauses = ClauseStructISOModel & {
  subClauses: SubClauses[];
};

export async function getClausesMarkdown(frameworkId: number): Promise<string> {
  let rows: string = ``;
  try {
    const reportData = (await getClausesReportQuery(
      frameworkId
    )) as AllClauses[];
    rows =
      reportData.length > 0
        ? reportData
            .map((clause) => {
              const subClauses =
                clause.subClauses?.length > 0
                  ? clause.subClauses
                      .map((subClause, i) => {
                        const res = `__${clause.clause_no}${i + 1}. ${
                          subClause.title
                        }__ <br> Implementation Description: ${
                          subClause.implementation_description
                        }<br>`;
                        return `  - ${res}\n`;
                      })
                      .join("\n")
                  : `No data`;

              return `__${clause.title}__\n${subClauses}\n`;
            })
            .join("\n")
        : `-`;
  } catch (error) {
    console.error(error);
    throw new Error(`Error while fetching the clauses data`);
  }
  return rows;
}
