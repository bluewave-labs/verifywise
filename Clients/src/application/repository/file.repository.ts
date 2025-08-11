import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/auth/getAuthToken";

export async function getFileById({
  id,
  signal,
  authToken = getAuthToken(),
  responseType = "json",
}: {
  id: string;
  signal?: AbortSignal;
  authToken?: string;
  responseType?: string;
}): Promise<any> {
  const response = await apiServices.get(`/files/${id}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
    responseType,
  });
  return response.data;
}

export async function createFile({
  body,
  authToken = getAuthToken(),
}: {
  body: any;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.post("/files", body, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}

export async function updateFile({
  id,
  body,
  authToken = getAuthToken(),
}: {
  id: number;
  body: any;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.patch(`/files/${id}`, body, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}

export async function deleteFile({
  id,
  authToken = getAuthToken(),
}: {
  id: number;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.delete(`/files/${id}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}

export async function getUserFilesMetaData({
  signal,
  authToken = getAuthToken(),
}: {
  signal?: AbortSignal;
  authToken?: string;
} = {}): Promise<any> {
  const response = await apiServices.get("/files", {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return response.data;
}

export async function getFilesByProjectId({
  projectId,
  signal,
  authToken = getAuthToken(),
}: {
  projectId: number;
  signal?: AbortSignal;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.get(`/files/by-projid/${projectId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return response.data;
}
