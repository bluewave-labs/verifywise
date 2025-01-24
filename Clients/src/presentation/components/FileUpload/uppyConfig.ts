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
console.log('file object: ', file);
  });
  //  uppy.on("file-added", (file) => {
  //    const fileSizeInMB = file.size
  //      ? (file.size / (1024 * 1024)).toFixed(2)
  //      : "0.00";
  //    console.log(`File added: ${file.name}, size: ${fileSizeInMB} MB`);
  //  });


  return uppy;
};
