// vendorRisk.model.ts

export type VendorRisk = {
  id: number;
  project_id: number; // Foreign key to refer to the project
  vendor_name: string;
  risk_name: string;
  owner: string;
  risk_level:
    | "No risk"
    | "Low risk"
    | "Medium risk"
    | "High risk"
    | "Very high risk"; // Restrict to specified values
  review_date: Date;
};
