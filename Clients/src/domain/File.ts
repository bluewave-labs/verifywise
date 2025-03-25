export interface FileData {
  id: string;
  fileName: string;
  size: number;
  type: string;
  data?: Blob;
}