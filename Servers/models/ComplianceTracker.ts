export interface ComplianceTracker {
  id: number
  project_id: number
  compliance_status: number
  pending_audits: number
  completed_assessments: number
  implemented_controls: number
}