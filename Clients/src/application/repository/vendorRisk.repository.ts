import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/auth/getAuthToken";

export async function getAllVendorRisks({
  signal,
  authToken = getAuthToken(),
}: {
  signal?: AbortSignal;
  authToken?: string;
} = {}): Promise<any> {
  const response = await apiServices.get("/vendorRisks/all", {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return  response.data;  
}

export async function getVendorRisksByProjectId({
  projectId,
  signal,
  authToken = getAuthToken(),
}: {
  projectId: number;
  signal?: AbortSignal;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.get(`/vendorRisks/by-projid/${projectId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return response.data
}

export async function getVendorRiskById({
  id,
  signal,
  authToken = getAuthToken(),
}: {
  id: number;
  signal?: AbortSignal;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.get(`/vendorRisks/${id}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return  response.data
}

export async function createVendorRisk({
  body,
  authToken = getAuthToken(),
}: {
  body: any;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.post("/vendorRisks", body, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response
}

export async function updateVendorRisk({
  id,
  body,
  authToken = getAuthToken(),
}: {
  id: number;
  body: any;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.patch(`/vendorRisks/${id}`, body, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}

export async function deleteVendorRisk({
  id,
  authToken = getAuthToken(),
}: {
  id: number;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.delete(`/vendorRisks/${id}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}

