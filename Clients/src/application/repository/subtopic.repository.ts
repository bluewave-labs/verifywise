import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/auth/getAuthToken";



export async function getSubtopicById({
  id,
  signal,
  authToken = getAuthToken(),
  responseType = "json",
}: {
  id: number;
  signal?: AbortSignal;
  authToken?: string;
  responseType?: string;
}): Promise<any> {
  const response = await apiServices.get(`/subtopics/${id}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
    responseType,
  });
  return response.data;
}

export async function createSubtopic({
  body,
  authToken = getAuthToken(),
}: {
  body: any;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.post("/subtopics", body, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}

export async function updateSubtopic({
  id,
  body,
  authToken = getAuthToken(),
}: {
  id: number;
  body: any;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.patch(`/subtopics/${id}`, body, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}

export async function deleteSubtopic({
  id,
  authToken = getAuthToken(),
}: {
  id: number;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.delete(`/subtopics/${id}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}
