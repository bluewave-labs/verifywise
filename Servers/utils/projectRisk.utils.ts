import { ProjectRisk } from "../models/projectRisk.model";
import pool from "../database/db";

export const getAllProjectRisksQuery = async (): Promise<ProjectRisk[]> => {
  console.log("getAllProjectRisks");
  const projectRisks = await pool.query("SELECT * FROM projectrisks");
  return projectRisks.rows;
};

export const getProjectRiskByIdQuery = async (
  id: number
): Promise<ProjectRisk | null> => {
  console.log("getProjectRiskById", id);
  const result = await pool.query("SELECT * FROM projectrisks WHERE id = $1", [
    id,
  ]);
  return result.rows.length ? result.rows[0] : null;
};

export const createProjectRiskQuery = async (
  projectRisk: {
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
    risk_level_autocalculated: string;
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
  }
): Promise<ProjectRisk> => {
  console.log("createProjectRisk");
  const result = await pool.query(
    "INSERT INTO projectrisks (project_id, risk_name, risk_owner, ai_lifecycle_phase, risk_description, risk_category, impact, assessment_mapping, controls_mapping, likelihood, severity, risk_level_autocalculated, review_notes, mitigation_status, current_risk_level, deadline, mitigation_plan, implementation_strategy, mitigation_evidence_document, likelihood_mitigation, risk_severity, final_risk_level, risk_approval, approval_status, date_of_assessment) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25) RETURNING *",
    [
      projectRisk.project_id,
      projectRisk.risk_name,
      projectRisk.risk_owner,
      projectRisk.ai_lifecycle_phase,
      projectRisk.risk_description,
      projectRisk.risk_category,
      projectRisk.impact,
      projectRisk.assessment_mapping,
      projectRisk.controls_mapping,
      projectRisk.likelihood,
      projectRisk.severity,
      projectRisk.risk_level_autocalculated,
      projectRisk.review_notes,
      projectRisk.mitigation_status,
      projectRisk.current_risk_level,
      projectRisk.deadline,
      projectRisk.mitigation_plan,
      projectRisk.implementation_strategy,
      projectRisk.mitigation_evidence_document,
      projectRisk.likelihood_mitigation,
      projectRisk.risk_severity,
      projectRisk.final_risk_level,
      projectRisk.risk_approval,
      projectRisk.approval_status,
      projectRisk.date_of_assessment,
    ]
  );
  return result.rows[0];
};

export const updateProjectRiskByIdQuery = async (
  id: number,
  projectRisk: Partial<{
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
    risk_level_autocalculated: string;
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
  }>
): Promise<ProjectRisk | null> => {
  console.log("updateProjectRiskById", id, projectRisk);
  const result = await pool.query(
    `UPDATE projectrisks SET 
      project_id = $1, 
      risk_name = $2, 
      risk_owner = $3, 
      ai_lifecycle_phase = $4, 
      risk_description = $5, 
      risk_category = $6, 
      impact = $7, 
      assessment_mapping = $8, 
      controls_mapping = $9, 
      likelihood = $10, 
      severity = $11, 
      risk_level_autocalculated = $12, 
      review_notes = $13, 
      mitigation_status = $14, 
      current_risk_level = $15, 
      deadline = $16, 
      mitigation_plan = $17, 
      implementation_strategy = $18, 
      mitigation_evidence_document = $19, 
      likelihood_mitigation = $20, 
      risk_severity = $21, 
      final_risk_level = $22, 
      risk_approval = $23, 
      approval_status = $24, 
      date_of_assessment = $25
    WHERE id = $26 RETURNING *`,
    [
      projectRisk.project_id,
      projectRisk.risk_name,
      projectRisk.risk_owner,
      projectRisk.ai_lifecycle_phase,
      projectRisk.risk_description,
      projectRisk.risk_category,
      projectRisk.impact,
      projectRisk.assessment_mapping,
      projectRisk.controls_mapping,
      projectRisk.likelihood,
      projectRisk.severity,
      projectRisk.risk_level_autocalculated,
      projectRisk.review_notes,
      projectRisk.mitigation_status,
      projectRisk.current_risk_level,
      projectRisk.deadline,
      projectRisk.mitigation_plan,
      projectRisk.implementation_strategy,
      projectRisk.mitigation_evidence_document,
      projectRisk.likelihood_mitigation,
      projectRisk.risk_severity,
      projectRisk.final_risk_level,
      projectRisk.risk_approval,
      projectRisk.approval_status,
      projectRisk.date_of_assessment,
      id,
    ]
  );
  return result.rows[0];
};

export const deleteProjectRiskByIdQuery = async (
  id: number
): Promise<ProjectRisk | null> => {
  console.log("deleteProjectRiskById", id);
  const result = await pool.query(
    "DELETE FROM projectrisks WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows.length ? result.rows[0] : null;
};
