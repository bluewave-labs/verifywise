export interface FileUploadProps {
  onSuccess?: (file: any) => void;
  onStart?: () => void;
  onError?: (message: string) => void;
  onProgress?: (progress: number) => void;
  allowedFileTypes?: string[];
  uploadEndpoint?: string;
  onHeightChange?: (newHeight: number) => void;
  assessmentId: number;
}
