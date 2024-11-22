export interface ProjectRisk {
  riskName: string;
  impact: string;
  owner: string;
  severity: string;
  likelihood: string;
  riskLevel: string;
  mitigation: string;
  finalRiskLevel: string;
}

const projectRisksData: ProjectRisk[] = [
  {
    riskName: "Nexus",
    impact: "High",
    owner: "Jack M.",
    severity: "Undesirable",
    likelihood: "Probable",
    riskLevel: "Medium",
    mitigation: "Details",
    finalRiskLevel: "Medium"
  },
  {
    riskName: "Apex",
    impact: "Medium high",
    owner: "Robert A.",
    severity: "Tolerable",
    likelihood: "Possible",
    riskLevel: "Low",
    mitigation: "Details",
    finalRiskLevel: "Low"
  },
  {
    riskName: "Data Breach",
    impact: "Very High",
    owner: "Sarah L.",
    severity: "Catastrophic",
    likelihood: "Unlikely",
    riskLevel: "High",
    mitigation: "Details",
    finalRiskLevel: "Medium"
  },
  {
    riskName: "Budget Overrun",
    impact: "High",
    owner: "Michael P.",
    severity: "Undesirable",
    likelihood: "Probable",
    riskLevel: "High",
    mitigation: "Details",
    finalRiskLevel: "Medium"
  },
  {
    riskName: "Skill Gap",
    impact: "Medium",
    owner: "Emma R.",
    severity: "Tolerable",
    likelihood: "Possible",
    riskLevel: "Medium",
    mitigation: "Details",
    finalRiskLevel: "Low"
  },
  {
    riskName: "Scope Creep",
    impact: "Medium high",
    owner: "David S.",
    severity: "Undesirable",
    likelihood: "Very Likely",
    riskLevel: "High",
    mitigation: "Details",
    finalRiskLevel: "Medium"
  },
  {
    riskName: "Integration Failure",
    impact: "High",
    owner: "Lisa K.",
    severity: "Serious",
    likelihood: "Possible",
    riskLevel: "Medium",
    mitigation: "Details",
    finalRiskLevel: "Low"
  },
  {
    riskName: "Performance Issues",
    impact: "Very High",
    owner: "Tom W.",
    severity: "Catastrophic",
    likelihood: "Probable",
    riskLevel: "Very High",
    mitigation: "Details",
    finalRiskLevel: "High"
  },
  {
    riskName: "Regulatory Non-compliance",
    impact: "Very High",
    owner: "Nancy O.",
    severity: "Catastrophic",
    likelihood: "Possible",
    riskLevel: "Very High",
    mitigation: "Details",
    finalRiskLevel: "High"
  },
  {
    riskName: "Vendor Lock-in",
    impact: "Medium",
    owner: "Chris B.",
    severity: "Tolerable",
    likelihood: "Probable",
    riskLevel: "Medium",
    mitigation: "Details",
    finalRiskLevel: "Low"
  }
];

export default projectRisksData;