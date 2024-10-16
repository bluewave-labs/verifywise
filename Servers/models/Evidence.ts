export interface Evidence {
  id: number
  subrequirement_id: number
  document_name: string
  document_type: string
  file_path: string
  upload_date: Date
  uploader_id: number
  description: string
  status: string
  last_reviewed: Date
  reviewer_id: number
  review_comments: string
}