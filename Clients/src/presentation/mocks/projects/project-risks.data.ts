export interface ProjectRisk {
  riskName: string;
  project: string;
  impact: string;
  probability: number;
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
    project: "Marketing AI",
    impact: "High",
    probability: 4,
    owner: "Jack M.",
    severity: "Undesirable",
    likelihood: "Probable",
    riskLevel: "Medium",
    mitigation: "Details",
    finalRiskLevel: "Medium"
  },
  {
    riskName: "Apex",
    project: "Software update",
    impact: "Medium high",
    probability: 3,
    owner: "Robert A.",
    severity: "Tolerable",
    likelihood: "Possible",
    riskLevel: "Low",
    mitigation: "Details",
    finalRiskLevel: "Low"
  },
  {
    riskName: "Data Breach",
    project: "Customer Database",
    impact: "Very High",
    probability: 2,
    owner: "Sarah L.",
    severity: "Catastrophic",
    likelihood: "Unlikely",
    riskLevel: "High",
    mitigation: "Details",
    finalRiskLevel: "Medium"
  },
  {
    riskName: "Budget Overrun",
    project: "Financial AI",
    impact: "High",
    probability: 4,
    owner: "Michael P.",
    severity: "Undesirable",
    likelihood: "Probable",
    riskLevel: "High",
    mitigation: "Details",
    finalRiskLevel: "Medium"
  },
  {
    riskName: "Skill Gap",
    project: "NLP Engine",
    impact: "Medium",
    probability: 3,
    owner: "Emma R.",
    severity: "Tolerable",
    likelihood: "Possible",
    riskLevel: "Medium",
    mitigation: "Details",
    finalRiskLevel: "Low"
  },
  {
    riskName: "Scope Creep",
    project: "Chatbot UI",
    impact: "Medium high",
    probability: 5,
    owner: "David S.",
    severity: "Undesirable",
    likelihood: "Very Likely",
    riskLevel: "High",
    mitigation: "Details",
    finalRiskLevel: "Medium"
  },
  {
    riskName: "Integration Failure",
    project: "CRM Integration",
    impact: "High",
    probability: 3,
    owner: "Lisa K.",
    severity: "Serious",
    likelihood: "Possible",
    riskLevel: "Medium",
    mitigation: "Details",
    finalRiskLevel: "Low"
  },
  {
    riskName: "Performance Issues",
    project: "Real-time Analytics",
    impact: "Very High",
    probability: 4,
    owner: "Tom W.",
    severity: "Catastrophic",
    likelihood: "Probable",
    riskLevel: "Very High",
    mitigation: "Details",
    finalRiskLevel: "High"
  },
  {
    riskName: "Regulatory Non-compliance",
    project: "Data Privacy",
    impact: "Very High",
    probability: 3,
    owner: "Nancy O.",
    severity: "Catastrophic",
    likelihood: "Possible",
    riskLevel: "Very High",
    mitigation: "Details",
    finalRiskLevel: "High"
  },
  {
    riskName: "Vendor Lock-in",
    project: "Cloud Infrastructure",
    impact: "Medium",
    probability: 4,
    owner: "Chris B.",
    severity: "Tolerable",
    likelihood: "Probable",
    riskLevel: "Medium",
    mitigation: "Details",
    finalRiskLevel: "Low"
  }
];

export default projectRisksData;