import Uppy from "@uppy/core";

import DropTarget from "@uppy/drop-target";


export const createUppyInstance = ()=> { 
  
  return new Uppy({
  autoProceed: false,
  debug: true,
})
  .use(DropTarget, {
    target: document.body,
  })
  }

