import Uppy from "@uppy/core";
import XHRUpload from "@uppy/xhr-upload";
import DropTarget from "@uppy/drop-target";



export const createUppyInstance = (assessmentId:string | number) => {
  const uppy = new Uppy({
    restrictions: {
      allowedFileTypes: ["application/pdf"], 
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


  return uppy;
};
