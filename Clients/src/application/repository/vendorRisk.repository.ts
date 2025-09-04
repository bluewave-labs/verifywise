import { apiServices } from "../../infrastructure/api/networkServices";

export async function getAllVendorRisks({
  signal,
}: {
  signal?: AbortSignal;
} = {}): Promise<any> {
  const response = await apiServices.get("/vendorRisks/all", {
    signal,
  });
  return  response.data;  
}

export async function getVendorRisksByProjectId({
  projectId,
  signal,
}: {
  projectId: number;
  signal?: AbortSignal;
}): Promise<any> {
  const response = await apiServices.get(`/vendorRisks/by-projid/${projectId}`, {
    signal,
  });
  return response.data
}

export async function getVendorRiskById({
  id,
  signal,
}: {
  id: number;
  signal?: AbortSignal;
}): Promise<any> {
  const response = await apiServices.get(`/vendorRisks/${id}`, {
    signal,
  });
  return  response.data
}

export async function createVendorRisk({
  body,
}: {
  body: any;
}): Promise<any> {
  const response = await apiServices.post("/vendorRisks", body);
  return response
}

export async function updateVendorRisk({
  id,
  body,
}: {
  id: number;
  body: any;
}): Promise<any> {
  const response = await apiServices.patch(`/vendorRisks/${id}`, body);
  return response;
}

export async function deleteVendorRisk({
  id,
}: {
  id: number;
}): Promise<any> {
  const response = await apiServices.delete(`/vendorRisks/${id}`);
  return response;
}

