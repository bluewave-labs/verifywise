import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/auth/getAuthToken";

export async function getAllProjectScopes({
  signal,
  authToken = getAuthToken(),
}: {
  signal?: AbortSignal;
  authToken?: string;
} = {}): Promise<any> {
  const response = await apiServices.get("/projectScopes", {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return response.data;
}

export async function getProjectScopeById({
  id,
  signal,
  authToken = getAuthToken(),
}: {
  id: number;
  signal?: AbortSignal;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.get(`/projectScopes/${id}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return response.data;
}

export async function createProjectScope({
  body,
  authToken = getAuthToken(),
}: {
  body: any;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.post("/projectScopes", body, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}

export async function updateProjectScope({
  id,
  body,
  authToken = getAuthToken(),
}: {
  id: number;
  body: any;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.put(`/projectScopes/${id}`, body, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}

export async function deleteProjectScope({
  id,
  authToken = getAuthToken(),
}: {
  id: number;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.delete(`/projectScopes/${id}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}