export interface FileUploadProps {
  onSuccess?: (file: any, response: any) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  uploadEndpoint?: string;
}
