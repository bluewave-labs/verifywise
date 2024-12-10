export interface FileUploadProps {
  onSuccess?: () => void;
  onStart?: ()=>void;
  onError?: (message:string) => void;
  onProgress?: (progress: number) => void;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  uploadEndpoint?: string;
}
