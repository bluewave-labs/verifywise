import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/auth/getAuthToken";

export async function getAllRoles({
  signal,
  authToken = getAuthToken(),
}: {
  signal?: AbortSignal;
  authToken?: string;
} = {}): Promise<any> {
  const response = await apiServices.get("/roles", {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return  response.data
}

export async function getRoleById({
  id,
  signal,
  authToken = getAuthToken(),
}: {
  id: number;
  signal?: AbortSignal;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.get(`/roles/${id}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return response.data
}

export async function createRole({
  body,
  authToken = getAuthToken(),
}: {
  body: any;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.post("/roles", body, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response
}

export async function updateRole({
  id,
  body,
  authToken = getAuthToken(),
}: {
  id: number;
  body: any;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.put(`/roles/${id}`, body, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response
}

export async function deleteRole({
  id,
  authToken = getAuthToken(),
}: {
  id: number;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.delete(`/roles/${id}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response
}