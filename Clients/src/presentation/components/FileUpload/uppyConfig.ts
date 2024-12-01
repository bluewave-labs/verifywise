import Uppy from "@uppy/core";
import XHRUpload from "@uppy/xhr-upload";

export const createUppyInstance = (
  uploadEndpoint: string | undefined,
  allowedFileTypes: string[],
  maxFileSize: number
) => {
  return new Uppy({
    restrictions: {
      maxNumberOfFiles: 1,
      allowedFileTypes,
      maxFileSize,
    },
    autoProceed: true,
  }).use(XHRUpload, {
    endpoint: uploadEndpoint || "api/replaceendpoint",
    formData: true,
    fieldName: "file",
  });
};
