import { apiServices } from "../../infrastructure/api/networkServices";


export async function getFileById({
  id,
  signal,
  responseType = "json",
}: {
  id: string;
  signal?: AbortSignal;
  responseType?: string;
}): Promise<any> {
  const response = await apiServices.get(`/files/${id}`, {
    signal,
    responseType,
  });
  return response.data;
}


export async function getUserFilesMetaData({
  signal,
}: {
  signal?: AbortSignal;
} = {}): Promise<any> {
  const response = await apiServices.get("/file-manager", {
    signal,
  });
  return response.data;
}


/**
 * Upload a file to the file manager
 *
 * @param {File} file - The file to upload
 * @param {AbortSignal} signal - Optional abort signal for cancellation
 * @returns {Promise<any>} Upload response with file metadata
 */
export async function uploadFileToManager({
  file,
  signal,
}: {
  file: File;
  signal?: AbortSignal;
}): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);

  // Delete Content-Type header to let axios auto-detect and set the proper boundary
  const response = await apiServices.post("/file-manager", formData, {
    signal,
    headers: {
      "Content-Type": undefined,
    },
  });

  return response.data;
}


/**
 * Download a file from the file manager
 *
 * @param {string} id - The file ID to download
 * @param {AbortSignal} signal - Optional abort signal for cancellation
 * @returns {Promise<any>} File blob response
 */
export async function downloadFileFromManager({
  id,
  signal,
}: {
  id: string;
  signal?: AbortSignal;
}): Promise<any> {
  const response = await apiServices.get(`/file-manager/${id}`, {
    signal,
    responseType: "blob",
  });
  return response.data;
}


/**
 * Delete a file from the file manager
 *
 * @param {string} id - The file ID to delete
 * @param {AbortSignal} signal - Optional abort signal for cancellation
 * @returns {Promise<any>} Delete response
 */
export async function deleteFileFromManager({
  id,
  signal,
}: {
  id: string;
  signal?: AbortSignal;
}): Promise<any> {
  const response = await apiServices.delete(`/file-manager/${id}`, {
    signal,
  });
  return response.data;
}


