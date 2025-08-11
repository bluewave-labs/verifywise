import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/auth/getAuthToken";

export async function getAllVendors({
  signal,
  authToken = getAuthToken(),
}: {
  signal?: AbortSignal;
  authToken?: string;
} = {}): Promise<any> {
  const response = await apiServices.get("/vendors", {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return  response.data
}

export async function getVendorById({
  id,
  signal,
  authToken = getAuthToken(),
}: {
  id: number;
  signal?: AbortSignal;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.get(`/vendors/${id}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return response.data;
}

export async function getVendorsByProjectId({
  projectId,
  signal,
  authToken = getAuthToken(),
}: {
  projectId: number;
  signal?: AbortSignal;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.get(`/vendors/project-id/${projectId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return response.data
}

export async function createVendor({
  body,
  authToken = getAuthToken(),
}: {
  body: any;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.post("/vendors", body, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response
}

export async function updateVendor({
  id,
  body,
  authToken = getAuthToken(),
}: {
  id: number;
  body: any;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.patch(`/vendors/${id}`, body, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}

export async function deleteVendor({
  id,
  authToken = getAuthToken(),
}: {
  id: number;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.delete(`/vendors/${id}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}