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
  restrictions?: {
    maxFileSize?: number;
    maxNumberOfFiles?: number;
    allowedFileTypes?: string[];
  };
}

/**
 * Creates and configures an instance of Uppy for file uploads.
 *
 * @param {UppyProps} props - The configuration properties for the Uppy instance.
 * @param {Record<string, unknown>} [props.meta] - Metadata to be included with the upload.
 * @param {string[]} [props.allowedMetaFields] - List of allowed metadata fields for the upload.
 * @param {(files: FileData[]) => void} [props.onChangeFiles] - Callback triggered when files are successfully uploaded.
 * @param {string} props.routeUrl - The route URL to which files will be uploaded.
 * @param {string} [props.authToken] - Authorization token for the upload request.
 * @param {Object} [props.restrictions] - Restrictions for the file uploads.
 * @param {number} [props.restrictions.maxFileSize] - Maximum file size allowed for uploads (in bytes).
 * @param {number} [props.restrictions.maxNumberOfFiles] - Maximum number of files allowed for uploads.
 * @param {string[]} [props.restrictions.allowedFileTypes] - List of allowed file types for uploads.
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
  restrictions,
}: UppyProps): Uppy => {
  const uppy = new Uppy();

  uppy.setOptions({
    autoProceed: false,
    restrictions: {
      maxFileSize: restrictions?.maxFileSize ?? 10000000,
      maxNumberOfFiles: restrictions?.maxNumberOfFiles ?? 5,
      allowedFileTypes: restrictions?.allowedFileTypes ?? ["application/pdf"],
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
        !isValidUrl(ENV_VARs.URL)
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

    const files = response.body.data as FileData[];

    onChangeFiles(files);
  });

  uppy.on("upload", () => {
    uppy.setMeta(meta || {});
  });

  return uppy;
};

/**
 * Validates if the provided string is a valid URL
 * @param urlString - The URL string to validate
 * @returns boolean indicating if the URL is valid
 */
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default createUppy;
