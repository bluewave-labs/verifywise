import Uppy from "@uppy/core";
import { store } from "../redux/store";
import XHRUpload from "@uppy/xhr-upload";
import { ENV_VARs } from "../../../env.vars";

interface UppyProps {
  meta?: any;
  allowedMetaFields?: string[];
  onChangeFiles?: (files: any) => void;
  routeUrl: string;
}

/**
 * Creates and configures an instance of Uppy for file uploads.
 *
 * @param {UppyProps} params - The configuration parameters for the Uppy instance.
 * @param {object} params.meta - Metadata to be set for the uploaded files.
 * @param {function} params.onChangeFiles - Callback function triggered when files are successfully uploaded.
 * @param {string[]} params.allowedMetaFields - List of allowed metadata fields for the upload.
 * @param {string} params.routeUrl - The endpoint route URL for the file upload.
 *
 * @returns {Uppy} - A configured Uppy instance.
 *
 * @remarks
 * - The Uppy instance is configured with restrictions such as maximum file size, number of files, and allowed file types.
 * - The `XHRUpload` plugin is used to handle file uploads, with an authorization token included in the headers.
 * - The `upload-success` event is used to process the server response and trigger the `onChangeFiles` callback with the uploaded file data.
 * - The `upload` event is used to set metadata for the files before uploading.
 *
 * @example
 * const uppy = createUppy({
 *   meta: { userId: "12345" },
 *   onChangeFiles: (files) => console.log(files),
 *   allowedMetaFields: ["userId"],
 *   routeUrl: "upload/files",
 * });
 */
const createUppy = ({ meta, onChangeFiles, allowedMetaFields, routeUrl }: UppyProps) => {
  const uppy =  new Uppy()

  uppy.setOptions({
    autoProceed: false,
    restrictions: {
      maxFileSize: 10000000,
      maxNumberOfFiles: 5,
      allowedFileTypes: ["application/pdf"],
    },
  });

  const state = store.getState();
  const authToken = state.auth.authToken;

  uppy.use(XHRUpload, {
    endpoint: `${ENV_VARs.URL}/${routeUrl}`,
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    allowedMetaFields
  });

  uppy.on('upload-success', (file, response) => {
    if (onChangeFiles && response?.body?.data) {
      const files: string[] = []
      const data = response.body.data as string[]

      data.map(file => files.push(JSON.parse(file)))
      onChangeFiles(files);
    }
  });

  uppy.on("upload", () => {
    uppy.setMeta(meta);
  });

  return uppy;
};

export default createUppy;
