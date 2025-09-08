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
  const response = await apiServices.get("/files", {
    signal,
  });
  return response.data;
}


