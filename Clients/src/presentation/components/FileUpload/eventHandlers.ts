export const handleUploadSuccess =
  (onSuccess?: (file: any, response: any) => void) =>
  (file: any, response: any) => {
    if (onSuccess) onSuccess(file, response);
  };

export const handleUploadError =
//will need file and response parameters later
  (onError?: (error: Error) => void) => (
    _:any,
    error:{name:string; message:string;details?:string},
    __?:any
  ) => {
    if (onError) {
        const errorObject = new Error(error.message);
        onError(errorObject);
    }
  };

export const handleUploadProgress =
  (onProgress?: (progress: number) => void) => (progress: any) => {
    if (progress?.bytesTotal) {
      onProgress?.(progress.bytesUploaded / progress.bytesTotal);
    }
  };
