export type Vendor = {
  id: number;
  // Vendor details tab
  vendorName: string;
  website: string;
  vendorProvides: string;
  vendorContactPerson: string;
  reviewStatus: string;
  reviewer: string;
  reviewResult: string;
  riskStatus: "Active" | "Under review" | "Not active";
  assignee: string;
  reviewDate: Date;
  // Risks tab
  riskDescription: string;
  impactDescription: string;
  impact: number;
  probability: number;
  riskSeverity: number;
  actionOwner: string;
  actionPlan: string;
  riskLevel:
  | "Very high risk"
  | "High risk"
  | "Medium risk"
  | "Low risk"
  | "Very low risk";
  likelihood: number;
};
