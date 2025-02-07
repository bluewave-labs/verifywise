import Uppy from "@uppy/core";
import XHRUpload from "@uppy/xhr-upload";
import DropTarget from "@uppy/drop-target";
import { ENV_VARs } from "../../../../env.vars";


export const createUppyInstance = (assessmentId: number) => {
  const uppy = new Uppy({
    restrictions: {
      allowedFileTypes: ["application/pdf"], 
      maxFileSize:null,
    },
    autoProceed: true, 
    debug: true,
  }); 

  uppy.use(XHRUpload, {
    endpoint: `${ENV_VARs.URL}/assessments/saveAnswers`,
    method: "POST",
    headers: {
      "Content-Type": "multipart/form-data",
      "asseessmentId": String(assessmentId),
    },
    fieldName: "file",
    formData: true,
  }); 
  uppy.use(DropTarget, {
    target: document.body, 
  });
  uppy.on('file-added', (file) => {
console.log('file object: ', file);
  });
  return uppy;
};
