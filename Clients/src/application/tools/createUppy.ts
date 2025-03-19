import Uppy from "@uppy/core";
import XHRUpload from "@uppy/xhr-upload";
import { ENV_VARs } from "../../../env.vars";
import { FileData } from "../../domain/File";

interface UppyProps {
  meta?: Record<string, unknown>;
  allowedMetaFields?: string[];
  onChangeFiles?: (files: FileData[]) => void;
  routeUrl: string;
  authToken?: string;
}

/**
 * Creates and configures an instance of Uppy for file uploads.
 *
 * @param {UppyProps} params - The configuration parameters for the Uppy instance.
 * @param {Record<string, any>} params.meta - Metadata to be attached to each file upload.
 * @param {(files: FileData[]) => void} params.onChangeFiles - Callback function triggered when files are successfully uploaded.
 * @param {string[]} params.allowedMetaFields - List of allowed metadata fields for the upload.
 * @param {string} params.routeUrl - The endpoint route URL for file uploads.
 * @param {string} params.authToken - The authentication token for the upload request.
 *
 * @returns {Uppy} - A configured Uppy instance ready for file uploads.
 *
 * @remarks
 * - The Uppy instance is configured to restrict uploads to a maximum of 5 files,
 *   each with a maximum size of 10 MB, and only allows files of type `application/pdf`.
 * - The `upload-success` event processes the server response and invokes the `onChangeFiles` callback
 *   with the parsed file data.
 * - The `upload` event sets the metadata for the upload using the provided `meta` parameter.
 *
 * @throws {Error} - Logs an error if the file data from the server response cannot be parsed as JSON.
 * @example
 * const uppy = createUppy({
 *   meta: { userId: "12345" },
 *   onChangeFiles: (files) => console.log(files),
 *   allowedMetaFields: ["userId"],
 *   routeUrl: "upload/files",
 *   authToken
 * });
 */
const createUppy = ({
  meta,
  onChangeFiles,
  allowedMetaFields,
  routeUrl,
  authToken,
}: UppyProps): Uppy => {
  const uppy = new Uppy();

  uppy.setOptions({
    autoProceed: false,
    restrictions: {
      maxFileSize: 10000000,
      maxNumberOfFiles: 5,
      allowedFileTypes: ["application/pdf"],
    },
  });

  const headers: Record<string, string> = authToken
    ? { Authorization: `Bearer ${authToken}` }
    : {};
  uppy.use(XHRUpload, {
    endpoint: (() => {
      if (
        !ENV_VARs.URL ||
        typeof ENV_VARs.URL !== "string" ||
        !/^https?:\/\/.+/.test(ENV_VARs.URL)
      ) {
        throw new Error("Invalid or undefined ENV_VARs.URL");
      }
      return `${ENV_VARs.URL}/${routeUrl}`;
    })(),
    headers,
    allowedMetaFields,
  });

  uppy.on("upload-success", (_, response) => {
    if (!onChangeFiles || !response?.body?.data) return;

    const data = response.body.data as string[];

    const files: FileData[] = data.reduce((acc: FileData[], file) => {
      try {
        const parsedFile = JSON.parse(file);
        acc.push(parsedFile);
      } catch (error) {
        console.error("Error parsing file data:", file, error);
      }
      return acc;
    }, []);

    onChangeFiles(files);
  });

  uppy.on("upload", () => {
    uppy.setMeta(meta || {});
  });

  return uppy;
};

export default createUppy;
