export type Vendor = {
  id: number;
  projectId: number;
  vendorName: string;
  assignee: string;
  vendorProvides: string;
  website: string;
  vendorContactPerson: string;
  reviewResult: string;
  reviewStatus: string;
  reviewer: string;
  riskStatus: "Active" | "Under review" | "Not active";
  reviewDate: Date;
  riskDescription: string;
  impactDescription: string;
  impact: number;
  probability: number;
  actionOwner: string;
  actionPlan: string;
  riskSeverity: number;
  riskLevel:
    | "Very high risk"
    | "High risk"
    | "Medium risk"
    | "Low risk"
    | "Very low risk";
  likelihood: number;
};
