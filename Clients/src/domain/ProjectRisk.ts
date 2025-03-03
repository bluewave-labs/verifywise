// projectRisk.model.ts

export type ProjectRisk = {
  id: number;
  project_id: number; // Foreign key to refer to the project
  risk_name: string;
  risk_owner: string;
  ai_lifecycle_phase: string;
  risk_description: string;
  risk_category: string;
  impact: string;
  assessment_mapping: string;
  controls_mapping: string;
  likelihood: string;
  severity: string;
  risk_level_autocalculated:
    | "No risk"
    | "Low risk"
    | "Medium risk"
    | "High risk"
    | "Very high risk";
  review_notes: string;
  mitigation_status: string;
  current_risk_level: string;
  deadline: Date;
  mitigation_plan: string;
  implementation_strategy: string;
  mitigation_evidence_document: string;
  likelihood_mitigation: string;
  risk_severity: string;
  final_risk_level: string;
  risk_approval: string;
  approval_status: string;
  date_of_assessment: Date;
};
