// Mock data for vendor and project risks
export const mockVendorRisks = [
  {
    risk_id: 1,
    vendor_id: 1,
    project_id: 1,
    vendor_name: "CloudTech Solutions",
    risk_description: "Data breach vulnerability in cloud infrastructure",
    impact_description: "Potential exposure of sensitive customer data",
    impact: "Critical" as const,
    likelihood: "Possible" as const,
    risk_level: "High risk" as const,
    action_owner: 1,
    action_plan: "Implement additional security measures"
  },
  {
    risk_id: 2,
    vendor_id: 2,
    project_id: 1,
    vendor_name: "AI Analytics Corp",
    risk_description: "Model bias in AI algorithms",
    impact_description: "Discriminatory outcomes affecting user groups",
    impact: "Major" as const,
    likelihood: "Likely" as const,
    risk_level: "Very high risk" as const,
    action_owner: 2,
    action_plan: "Conduct bias testing and model retraining"
  },
  {
    risk_id: 3,
    vendor_id: 3,
    project_id: 1,
    vendor_name: "SecureData Inc",
    risk_description: "Service availability issues",
    impact_description: "Potential downtime affecting operations",
    impact: "Moderate" as const,
    likelihood: "Unlikely" as const,
    risk_level: "Medium risk" as const,
    action_owner: 3,
    action_plan: "Establish backup service providers"
  },
  {
    risk_id: 4,
    vendor_id: 4,
    project_id: 1,
    vendor_name: "TechSupport Plus",
    risk_description: "Compliance documentation gaps",
    impact_description: "Regulatory compliance issues",
    impact: "Minor" as const,
    likelihood: "Rare" as const,
    risk_level: "Low risk" as const,
    action_owner: 4,
    action_plan: "Update compliance documentation"
  }
];

export const mockProjectRisks = [
  {
    id: 1,
    project_id: 1,
    risk_name: "Data Quality Issues",
    risk_category: ["Data privacy risk", "Operational risk"] as const,
    risk_level_autocalculated: "High risk" as const,
    current_risk_level: "High risk" as const,
    severity: "Major" as const,
    likelihood: "Likely" as const,
    mitigation_status: "In Progress" as const
  },
  {
    id: 2,
    project_id: 1,
    risk_name: "Model Performance Degradation",
    risk_category: ["Technological risk", "Operational risk"] as const,
    risk_level_autocalculated: "Medium risk" as const,
    current_risk_level: "Medium risk" as const,
    severity: "Moderate" as const,
    likelihood: "Possible" as const,
    mitigation_status: "Not Started" as const
  },
  {
    id: 3,
    project_id: 1,
    risk_name: "Regulatory Compliance Gap",
    risk_category: ["Compliance risk", "Legal risk"] as const,
    risk_level_autocalculated: "Very high risk" as const,
    current_risk_level: "Very high risk" as const,
    severity: "Critical" as const,
    likelihood: "Almost Certain" as const,
    mitigation_status: "Completed" as const
  },
  {
    id: 4,
    project_id: 1,
    risk_name: "Third-party Integration Risk",
    risk_category: ["Third-party/vendor risk", "Technological risk"] as const,
    risk_level_autocalculated: "Low risk" as const,
    current_risk_level: "Low risk" as const,
    severity: "Minor" as const,
    likelihood: "Unlikely" as const,
    mitigation_status: "On Hold" as const
  }
];

export const mockRootProps = {
  projectId: "1"
};