export interface Risk {
  id: number
  project_id: number
  risk_description: string
  impact: string
  probability: string
  owner_id: number
  severity: string
  likelihood: string
  risk_level: string
}
