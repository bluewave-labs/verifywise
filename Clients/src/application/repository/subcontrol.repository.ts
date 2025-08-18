import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/auth/getAuthToken";


export async function getSubcontrolById({
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
  const response = await apiServices.get(`/subcontrols/${id}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
    responseType,
  });
  return response.data;
}

export async function createSubcontrol({
  body,
  authToken = getAuthToken(),
}: {
  body: any;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.post("/subcontrols", body, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}

export async function updateSubcontrol({
  id,
  body,
  authToken = getAuthToken(),
}: {
  id: number;
  body: any;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.patch(`/subcontrols/${id}`, body, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}

export async function deleteSubcontrol({
  id,
  authToken = getAuthToken(),
}: {
  id: number;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.delete(`/subcontrols/${id}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}
