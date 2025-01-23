import Uppy from "@uppy/core";
import XHRUpload from "@uppy/xhr-upload";
import DropTarget from "@uppy/drop-target";



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
    endpoint: "http://localhost:3000/assessments/saveAnswers",
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
    console.log(`File added: ${file.name}, Size: ${file.size}`);
    if(!file.size || file.size === 0) {
      console.log("File size is missing or 0");
    }
  });


  return uppy;
};
