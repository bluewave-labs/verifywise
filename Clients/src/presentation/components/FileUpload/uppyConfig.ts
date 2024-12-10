import Uppy from "@uppy/core";
import DropTarget from "@uppy/drop-target";

export const createUppyInstance = () => {
  return new Uppy({
    restrictions: {
      maxFileSize: 50 * 1024 * 1024,
      allowedFileTypes: ["pdf"],
    },
    autoProceed: false,
    debug: true,
  }).use(DropTarget, {
    target:document.body
  })
};
