export interface FileData {
  id: string;
  uploadDate: string;
  uploader: string;
  fileName: string;
  data?: Blob;
}
