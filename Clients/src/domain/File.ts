/**
 * Represents a file with its metadata and optional data.
 *
 * @property {string} id - Unique identifier for the file.
 * @property {(string|undefined)} type - MIME type of the file, optional.
 * @property {string} uploadDate - Date when the file was uploaded.
 * @property {string} uploader - Username or identifier of the user who uploaded the file.
 * @property {string} fileName - Name of the file.
 * @property {(number|undefined)} size - Size of the file in bytes, optional.
 * @property {(Blob|undefined)} data - Blob containing the file data, optional.
 */

export interface FileData {
  id: string;
  type?: string;
  uploadDate: string;
  uploader: string;
  fileName: string;
  size?: number;
  data?: Blob;
}
