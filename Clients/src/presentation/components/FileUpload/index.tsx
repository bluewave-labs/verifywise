import React from "react";
import Uppy from "@uppy/core";
import XHRUpload from "@uppy/xhr-upload";
import { DragDrop } from "@uppy/react";
import "@uppy/core/dist/style.css";
import "@uppy/drag-drop/dist/style.css";

const FileUploadComponent: React.FC = () => {
  const uppy = new Uppy({
    restrictions: { maxNumberOfFiles: 10 },
    autoProceed: true,
  });

  uppy.use(XHRUpload, {
    endpoint: '/api/upload',
    fieldName: 'file',
    headers: {
        authorization: 'Bearer your-auth-token',
    },
  });

  uppy.on("file-added", (file) => {
    console.log("File added:", file);
  });

  uppy.on("upload-success", (file, response) => {
    console.log("Upload successful:", file, response);
  });

  return (
    <div>
      <h2>File Upload</h2>
      <DragDrop uppy={uppy} />
    </div>
  );
};

export default FileUploadComponent;
