export interface AuditorFeedback {
  id: number
  subrequirement_id: number
  assessment_type: string
  assessment_date: Date
  auditor_id: number
  compliance_status: string
  findings: string
  recommendations: string
  corrective_actions: string
  follow_up_date: Date
  follow_up_notes: string
  attachments: string
  created_at: Date
  updated_at: Date
}
