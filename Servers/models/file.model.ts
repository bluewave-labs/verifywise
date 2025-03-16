export interface File {
  filename: string;
  content: Buffer;
  project_id: number;
  uploaded_by: number;
  uploaded_time: Date;
}
