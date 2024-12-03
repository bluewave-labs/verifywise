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


  //local storage
  export const uploadToLocalStorage = async (uppy: { getFiles: () => any; }) => {
  const files = uppy.getFiles();

  if (!files.length) {
    alert('No files to upload!');
    return;
  }

  files.forEach((file: { data: any; id: string; name: any; type: any; }) => {
    const fileData = file.data; // File Blob
    const reader = new FileReader();

    reader.onload = () => {
      // Save file to localStorage (converts binary data to Base64 string)
      const base64Data = reader.result;
      localStorage.setItem(file.id, JSON.stringify({
        name: file.name,
        type: file.type,
        data: base64Data,
      }));
      console.log(`File ${file.name} saved to localStorage.`);
    };

    reader.readAsDataURL(fileData);
  });

  alert('Files uploaded to local storage successfully!');
};

