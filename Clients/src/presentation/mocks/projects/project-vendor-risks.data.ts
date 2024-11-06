export interface VendorRisk {
  riskName: string;
  vendor: string;
  contractOwner: string;
  riskLevel: string;
  reviewData: string
}

const vendorRisksData: VendorRisk[] = [
  {
    vendor: "CloudHost Inc.",
    riskName: "Service Disruption",
    contractOwner: "Jack M.",
    riskLevel: "High",
    reviewData: "23 Jan 2024"
  },
  {
    riskName: "Data Breach",
    vendor: "SecureData Systems",
    contractOwner: "Bob S.",
    riskLevel: "High",
    reviewData: "17 March 2024"
  },
  {
    riskName: "Contract Violation",
    vendor: "AI Solutions Ltd.",
    contractOwner: "Carol M.",
    riskLevel: "High",
    reviewData: "23 Jan 2024"
  },
  {
    riskName: "Vendor Insolvency",
    vendor: "TechStartup Co.",
    contractOwner: "David L.",
    riskLevel: "Medium",
    reviewData: "17 March 2024"
  },
  {
    riskName: "API Changes",
    vendor: "IntegrateNow",
    contractOwner: "Eva N.",
    riskLevel: "Medium",
    reviewData: "23 Jan 2024"
  },
  {
    riskName: "Support Quality Decline",
    vendor: "24/7 Support Co.",
    contractOwner: "Frank O.",
    riskLevel: "Medium",
    reviewData: "17 March 2024"
  },
  {
    riskName: "Price Increase",
    vendor: "CostEffective Solutions",
    contractOwner: "Grace P.",
    riskLevel: "High",
    reviewData: "23 Jan 2024"
  },
  {
    riskName: "Compliance Failure",
    vendor: "RegTech Innovations",
    contractOwner: "Henry Q.",
    riskLevel: "High",
    reviewData: "17 March 2024"
  },
  {
    riskName: "Intellectual Property Dispute",
    vendor: "InnovateAI Corp",
    contractOwner: "Irene R.",
    riskLevel: "Medium",
    reviewData: "23 Jan 2024"
  },
  {
    riskName: "Vendor Lock-in",
    vendor: "ProprietaryTech Inc.",
    contractOwner: "Jack T.",
    riskLevel: "High",
    reviewData: "17 March 2024"
  }
];

export default vendorRisksData;