import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/auth/getAuthToken";

// Get all vendors
export async function getAllVendors({
  signal,
  authToken = getAuthToken(),
  responseType = "json",
}: {
  signal?: AbortSignal;
  authToken?: string;
  responseType?: string;
} = {}): Promise<any> {
  const response = await apiServices.get("/vendors", {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
    responseType,
  });
  return response.data;
}

// Get all vendors for a project
export async function getVendorsByProjectId({
  projectId,
  signal,
  authToken = getAuthToken(),
  responseType = "json",
}: {
  projectId: number;
  signal?: AbortSignal;
  authToken?: string;
  responseType?: string;
}): Promise<any> {
  const response = await apiServices.get(`/vendors/project-id/${projectId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
    responseType,
  });
  return response.data;
}

// Get a vendor by ID
export async function getVendorById({
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
  const response = await apiServices.get(`/vendors/${id}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
    responseType,
  });
  return response.data;
}

// Create a vendor
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
  return response;
}

// Update a vendor
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

// Delete a vendor
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
