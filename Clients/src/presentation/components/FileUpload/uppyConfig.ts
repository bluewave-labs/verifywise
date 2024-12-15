import Uppy from "@uppy/core";
import XHRUpload from "@uppy/xhr-upload";
import DropTarget from "@uppy/drop-target";



export const createUppyInstance = () => {
  const uppy = new Uppy({
    restrictions: {
      maxFileSize: 50 * 1024 * 1024, 
      allowedFileTypes: ["application/pdf"], 
    },
    autoProceed: true, 
    debug: true,
  }); 

  uppy.use(XHRUpload, {
    endpoint: "http://localhost:3000/questions/2",
    method: "POST",
    headers: {
      Authorization: "Placeholder",
    },
    fieldName: "file",
  }); 
  uppy.use(DropTarget, {
    target: document.body, 
  });


  return uppy;
};
