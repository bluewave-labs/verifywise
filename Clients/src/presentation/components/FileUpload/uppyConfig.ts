import Uppy from "@uppy/core";
//import XHRUpload from "@uppy/xhr-upload";

import GoldenRetriever from "@uppy/golden-retriever";
import DropTarget from "@uppy/drop-target";


export const createUppyInstance = ()=> { return new Uppy({
  autoProceed: false,
  debug: true,
})
  .use(DropTarget, {
    target: document.body,
  })
  .use(GoldenRetriever);}

// export const createUppyInstance = (
//   //uploadEndpoint: string | undefined,
//   allowedFileTypes: string[],
//   maxFileSize: number
// ) => {
//   return new Uppy({
//     restrictions: {
//       maxNumberOfFiles: 1,
//       allowedFileTypes,
//       maxFileSize,
//     },
//     autoProceed: true,
//   }).use(GoldenRetriever
    
    
//     //XHRUpload, {
//     //endpoint: uploadEndpoint || "api/replaceendpoint",
//     //formData: true,
//     //fieldName: "file",
//   //}


// );
// };
