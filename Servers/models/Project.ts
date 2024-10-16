export interface Project {
  id: number
  name: string
  description: string
  last_updated: Date
  owner_id: number
  compliance_status: string
  controls_completed: number
  requirements_completed: number
}