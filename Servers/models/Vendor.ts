export interface Vendor {
  id: number,
  name: string,
  project_id: number
  description: string,
  website: string,
  contact_person: string,
  review_result: string,
  review_status: string,
  reviewer_id: number,
  review_date: Date,
  risk_status: string,
}
