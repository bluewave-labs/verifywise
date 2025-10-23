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

  const response = await apiServices.post("/file-manager", formData, {
    signal,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}


