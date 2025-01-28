export interface FileUploadProps {
  open: boolean;
  onSuccess?: (file: any) => void;
  onStart?: () => void;
  onError?: (message: string) => void;
  onClose?: () => void;
  onProgress?: (progress: number) => void;
  allowedFileTypes?: string[];
  uploadEndpoint?: string;
  onHeightChange?: (newHeight: number) => void;
  assessmentId: number;
}
