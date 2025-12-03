/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiServices } from "../../infrastructure/api/networkServices";

// Type definitions for API responses
export interface FileMetadata {
  id: string;
  filename: string;
  size: number;
  mimetype: string;
  upload_date: string;
  uploaded_by: string;
  uploader_name?: string;
  uploader_surname?: string;
  source?: string;
  project_title?: string;
  project_id?: string | number;
  parent_id?: number;
  sub_id?: number;
  meta_id?: number;
  is_evidence?: boolean;
}

export interface FileManagerResponse {
  success: boolean;
  data: {
    files: FileMetadata[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
    };
  };
}

export interface FileUploadResponse {
  message: string;
  data: {
    id: number;
    filename: string;
    size: number;
    mimetype: string;
    upload_date: string;
    uploaded_by: number;
    modelId?: string; // optional
  };
}

export async function getFileById({
  id,
  signal,
  responseType = "json",
}: {
  id: string;
  signal?: AbortSignal;
  responseType?: string;
}): Promise<Blob | ArrayBuffer> {
  const response = await apiServices.get<any>(`/files/${id}`, {
    signal,
    responseType,
  });
  return response.data;
}


/**
 * Get all files metadata for the current user's organization
 *
 * @param {AbortSignal} signal - Optional abort signal for cancellation
 * @returns {Promise<FileMetadata[]>} Array of file metadata
 */
export async function getUserFilesMetaData({
  signal,
}: {
  signal?: AbortSignal;
} = {}): Promise<FileMetadata[]> {
    const [fileManageResponse, fileResponse] = await Promise.all([
      apiServices.get<FileManagerResponse>("/file-manager", { signal }),
      apiServices.get<any[]>("/files", { signal })
    ]);

    // Extract and return all file data from API
    // Keep all fields intact so transformFileData can process them
    const rawFiles = [...(fileManageResponse.data?.data?.files ?? []), ...(fileResponse.data ?? [])];

    return rawFiles.map((f: any) => ({
        id: String(f.id),
        filename: f.filename,
        size: f?.size,
        mimetype: f?.mimetype,
        upload_date: f?.upload_date || f?.uploaded_time,
        uploaded_by: String(f?.uploaded_by),
        uploader_name: f?.uploader_name,         // Include uploader name
        uploader_surname: f?.uploader_surname,   // Include uploader surname
        source: f?.source,
        project_title: f?.project_title,
        project_id: f?.project_id,
        parent_id: f?.parent_id,
        sub_id: f?.sub_id,
        meta_id: f?.meta_id,
        is_evidence: f?.is_evidence,
    })) as FileMetadata[];
}



/**
 * Upload a file to the file manager
 *
 * @param {File} file - The file to upload
 * @param {AbortSignal} signal - Optional abort signal for cancellation
 * @returns {Promise<FileUploadResponse>} Upload response with file metadata
 */
export async function uploadFileToManager({
  file,
  model_id, // add this
  signal,
}: {
  file: File;
  model_id?: string | number | undefined | null; // allow all safe cases
  signal?: AbortSignal;
}): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

   // Append model_id only if it's defined and valid
  formData.append("model_id", model_id ? String(model_id) : ""); // ✅ always present


  // Delete Content-Type header to let axios auto-detect and set the proper boundary
  const response = await apiServices.post<FileUploadResponse>("/file-manager", formData, {
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
 * @returns {Promise<Blob>} File blob response
 */
export async function downloadFileFromManager({
  id,
  signal,
  source,
}: {
  id: string;
  signal?: AbortSignal;
  source?: string;
}): Promise<Blob> {
  const response = await apiServices.get<Blob>(`/file-manager/${id}?isFileManagerFile=${source === "File Manager"}`, {
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
  source,
}: {
  id: string;
  signal?: AbortSignal;
  source?: string;
}): Promise<any> {
  const response = await apiServices.delete<any>(`/file-manager/${id}?isFileManagerFile=${source === "File Manager"}`, {
    signal,
  });
  return response.data;
}