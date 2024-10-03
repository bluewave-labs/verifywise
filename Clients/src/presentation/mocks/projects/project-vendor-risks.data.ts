interface VendorRisk {
  riskName: string;
  vendor: string;
  impact: string;
  probability: number;
  contractOwner: string;
  severity: string;
  likelihood: string;
  riskLevel: string;
  mitigation: string;
  finalRiskLevel: string;
}

const vendorRisks: VendorRisk[] = [
  {
    riskName: "Service Disruption",
    vendor: "CloudHost Inc.",
    impact: "Very High",
    probability: 2,
    contractOwner: "Alice J.",
    severity: "Catastrophic",
    likelihood: "Unlikely",
    riskLevel: "High",
    mitigation: "Redundancy Plan",
    finalRiskLevel: "Medium"
  },
  {
    riskName: "Data Breach",
    vendor: "SecureData Systems",
    impact: "Very High",
    probability: 1,
    contractOwner: "Bob S.",
    severity: "Catastrophic",
    likelihood: "Rare",
    riskLevel: "High",
    mitigation: "Enhanced Encryption",
    finalRiskLevel: "Medium"
  },
  {
    riskName: "Contract Violation",
    vendor: "AI Solutions Ltd.",
    impact: "High",
    probability: 3,
    contractOwner: "Carol M.",
    severity: "Serious",
    likelihood: "Possible",
    riskLevel: "High",
    mitigation: "Legal Review",
    finalRiskLevel: "Medium"
  },
  {
    riskName: "Vendor Insolvency",
    vendor: "TechStartup Co.",
    impact: "High",
    probability: 2,
    contractOwner: "David L.",
    severity: "Serious",
    likelihood: "Unlikely",
    riskLevel: "Medium",
    mitigation: "Financial Monitoring",
    finalRiskLevel: "Low"
  },
  {
    riskName: "API Changes",
    vendor: "IntegrateNow",
    impact: "Medium",
    probability: 4,
    contractOwner: "Eva N.",
    severity: "Moderate",
    likelihood: "Probable",
    riskLevel: "Medium",
    mitigation: "Version Control",
    finalRiskLevel: "Low"
  },
  {
    riskName: "Support Quality Decline",
    vendor: "24/7 Support Co.",
    impact: "Medium",
    probability: 3,
    contractOwner: "Frank O.",
    severity: "Moderate",
    likelihood: "Possible",
    riskLevel: "Medium",
    mitigation: "SLA Enforcement",
    finalRiskLevel: "Low"
  },
  {
    riskName: "Price Increase",
    vendor: "CostEffective Solutions",
    impact: "Medium High",
    probability: 4,
    contractOwner: "Grace P.",
    severity: "Serious",
    likelihood: "Probable",
    riskLevel: "High",
    mitigation: "Contract Negotiation",
    finalRiskLevel: "Medium"
  },
  {
    riskName: "Compliance Failure",
    vendor: "RegTech Innovations",
    impact: "Very High",
    probability: 2,
    contractOwner: "Henry Q.",
    severity: "Catastrophic",
    likelihood: "Unlikely",
    riskLevel: "High",
    mitigation: "Audit Program",
    finalRiskLevel: "Medium"
  },
  {
    riskName: "Intellectual Property Dispute",
    vendor: "InnovateAI Corp",
    impact: "High",
    probability: 1,
    contractOwner: "Irene R.",
    severity: "Serious",
    likelihood: "Rare",
    riskLevel: "Medium",
    mitigation: "IP Agreement Review",
    finalRiskLevel: "Low"
  },
  {
    riskName: "Vendor Lock-in",
    vendor: "ProprietaryTech Inc.",
    impact: "Medium High",
    probability: 5,
    contractOwner: "Jack T.",
    severity: "Moderate",
    likelihood: "Very Likely",
    riskLevel: "High",
    mitigation: "Diversification Strategy",
    finalRiskLevel: "Medium"
  }
];
