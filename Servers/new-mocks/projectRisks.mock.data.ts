// projectRiskMockData.ts

/**
 * for the risk_level_autocalculated the values are: No risk, Low risk, Medium risk, High risk, Very high risk
 *
 */

// Define the type for ProjectRisk based on the table structure
type ProjectRisk = {
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

// Sample mock data for ProjectRisk
const mockProjectRisks: ProjectRisk[] = [
  {
    id: 1,
    project_id: 1, // Refers to the project with id 1
    risk_name: "Data Privacy Compliance",
    risk_owner: "Alice",
    ai_lifecycle_phase: "Deployment",
    risk_description: "Risk of non-compliance with data privacy regulations.",
    risk_category: "Regulatory",
    impact: "High",
    assessment_mapping: "GDPR Compliance Check",
    controls_mapping: "Data Access Controls",
    likelihood: "Moderate",
    severity: "High",
    risk_level_autocalculated: "Medium risk",
    review_notes: "Need for regular audits.",
    mitigation_status: "In Progress",
    current_risk_level: "Medium",
    deadline: new Date("2024-12-31"),
    mitigation_plan: "Implement data anonymization.",
    implementation_strategy: "Anonymize user data in production environments.",
    mitigation_evidence_document: "Data_Anonymization_Plan.pdf",
    likelihood_mitigation: "Reduced",
    risk_severity: "Moderate",
    final_risk_level: "Low",
    risk_approval: "Pending",
    approval_status: "Under Review",
    date_of_assessment: new Date("2024-11-01"),
  },
  {
    id: 2,
    project_id: 2, // Refers to the project with id 2
    risk_name: "Algorithm Bias",
    risk_owner: "Bob",
    ai_lifecycle_phase: "Development",
    risk_description: "Potential for biased outcomes in AI predictions.",
    risk_category: "Ethical",
    impact: "Medium",
    assessment_mapping: "Bias Testing Framework",
    controls_mapping: "Diversity Audits",
    likelihood: "High",
    severity: "Medium",
    risk_level_autocalculated: "High risk",
    review_notes: "Regular monitoring required.",
    mitigation_status: "Mitigated",
    current_risk_level: "Low",
    deadline: new Date("2025-03-15"),
    mitigation_plan: "Introduce fair algorithms.",
    implementation_strategy: "Regularly assess and modify algorithms.",
    mitigation_evidence_document: "Bias_Test_Report.pdf",
    likelihood_mitigation: "Significantly Reduced",
    risk_severity: "Low",
    final_risk_level: "Low",
    risk_approval: "Approved",
    approval_status: "Completed",
    date_of_assessment: new Date("2024-10-15"),
  },
];

// Export the mock data for use in other files
export default mockProjectRisks;
