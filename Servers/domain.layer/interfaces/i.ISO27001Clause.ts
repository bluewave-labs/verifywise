export interface IISO27001Clause {
  id?: number;
  arrangement: number;
  clause_no: number;
  clause_name: string;
  requirement_summary: string;
  key_questions: string[];
  evidence_examples: string[];
  implementation_description: string;
  status: string;
  owner: number;
  reviewer: number;
  approver: number;
  due_date: Date;
  cross_mappings: object[];
  framework_id: number;
  project_id: number;
}
