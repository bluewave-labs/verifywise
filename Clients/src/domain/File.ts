export interface FileData {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  uploader: string;
  fileName: string;
  size: number;
  data?: Blob;
}


