export interface IVendorRisk {
  id: number;
  risk_description: string;
  impact_description: string;
  risk_severity: string;
  likelihood: string;
  risk_level: string;
  action_owner: number;
  action_plan: string;
  vendor_id: number;
}
