export type Vendor = {
  id: number;
  projectId: number;
  vendor_name: string;
  assignee: string;
  vendor_provides: string;
  website: string;
  vendor_contact_person: string;
  review_result: string;
  review_status: string;
  reviewer: string;
  risk_status: "Active" | "Under review" | "Not active";
  review_date: Date;
  risk_description: string;
  impact_description: string;
  impact: number;
  probability: number;
  action_owner: string;
  action_plan: string;
  risk_severity: number;
  risk_level:
    | "Very high risk"
    | "High risk"
    | "Medium risk"
    | "Low risk"
    | "Very low risk";
  likelihood: number;
};
