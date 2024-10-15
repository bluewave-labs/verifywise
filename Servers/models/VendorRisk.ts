export interface VendorRisk {
  id: number
  vendor_id: number
  risk_description: string
  impact_description: string
  project_id: number
  probability: string
  impact: string
  action_plan: string
  action_owner_id: number
  risk_severity: string
  likelihood: string
  risk_level: string
}