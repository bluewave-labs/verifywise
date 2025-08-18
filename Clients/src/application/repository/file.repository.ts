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


