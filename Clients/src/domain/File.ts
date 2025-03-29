export interface FileData {
  id: string;
  filename: string;
  type: string;
  uploadDate: string;
  uploader: string;
  fileName: string;
  size: number;
  data?: Blob;
}
