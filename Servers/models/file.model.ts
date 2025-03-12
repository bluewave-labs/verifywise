export interface File {
  filename: string;
  content: Buffer;
  uploaded_by: number;
  uploaded_time: Date;
}
