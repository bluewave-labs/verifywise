import { ContextOfOrganization } from "./subclauses/04-context-of-organization.subclause";
import { Leadership } from "./subclauses/05-leadership.subclause";
import { Planning } from "./subclauses/06-planning.subclause";
import { Support } from "./subclauses/07-support.subclause";
import { Operation } from "./subclauses/08-operation.subclause";
import { PerformanceEvaluation } from "./subclauses/09-performance-evaluation.subclause";
import { Improvement } from "./subclauses/10-improvement.subclause";
import { ClauseStructISO } from "../../../domain.layer/frameworks/ISO-42001/clauseStructISO.model";

export const Clauses: ClauseStructISO[] = [
  {
    title: "Clause 4: Context of the Organization",
    clause_no: 4,
    subclauses: ContextOfOrganization,
  },
  {
    title: "Clause 5: Leadership",
    clause_no: 5,
    subclauses: Leadership,
  },
  {
    title: "Clause 6: Planning",
    clause_no: 6,
    subclauses: Planning,
  },
  {
    title: "Clause 7: Support",
    clause_no: 7,
    subclauses: Support,
  },
  {
    title: "Clause 8: Operation",
    clause_no: 8,
    subclauses: Operation,
  },
  {
    title: "Clause 9: Performance Evaluation",
    clause_no: 9,
    subclauses: PerformanceEvaluation,
  },
  {
    title: "Clause 10: Improvement",
    clause_no: 10,
    subclauses: Improvement,
  },
];
