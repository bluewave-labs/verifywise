import { apiServices, ApiResponse } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";
import { VendorRisk, CreateVendorRiskInput, UpdateVendorRiskInput } from "../../domain/types/VendorRisk";

export async function getAllVendorRisks({
  signal,
  filter = 'active',
}: {
  signal?: AbortSignal;
  filter?: 'active' | 'deleted' | 'all';
} = {}): Promise<BackendResponse<VendorRisk[]>> {
  const response = await apiServices.get<BackendResponse<VendorRisk[]>>(`/vendorRisks/all?filter=${filter}`, {
    signal,
  });
  return response.data;
}

export async function getVendorRisksByProjectId({
  projectId,
  signal,
  filter = 'active',
}: {
  projectId: number;
  signal?: AbortSignal;
  filter?: 'active' | 'deleted' | 'all';
}): Promise<BackendResponse<VendorRisk[]>> {
  const response = await apiServices.get<BackendResponse<VendorRisk[]>>(`/vendorRisks/by-projid/${projectId}?filter=${filter}`, {
    signal,
  });
  return response.data;
}

export async function getVendorRisksByVendorId({
  vendorId,
  signal,
  filter = 'active',
}: {
  vendorId: number;
  signal?: AbortSignal;
  filter?: 'active' | 'deleted' | 'all';
}): Promise<BackendResponse<VendorRisk[]>> {
  const response = await apiServices.get<BackendResponse<VendorRisk[]>>(`/vendorRisks/by-vendorid/${vendorId}?filter=${filter}`, {
    signal,
  });
  return response.data;
}

export async function getVendorRiskById({
  id,
  signal,
}: {
  id: number;
  signal?: AbortSignal;
}): Promise<BackendResponse<VendorRisk>> {
  const response = await apiServices.get<BackendResponse<VendorRisk>>(`/vendorRisks/${id}`, {
    signal,
  });
  return response.data;
}

export async function createVendorRisk({
  body,
}: {
  body: CreateVendorRiskInput;
}): Promise<ApiResponse<BackendResponse<VendorRisk>>> {
  const response = await apiServices.post<BackendResponse<VendorRisk>>("/vendorRisks", body);
  return response;
}

export async function updateVendorRisk({
  id,
  body,
}: {
  id: number;
  body: UpdateVendorRiskInput;
}): Promise<ApiResponse<BackendResponse<VendorRisk>>> {
  const response = await apiServices.put<BackendResponse<VendorRisk>>(`/vendorRisks/${id}`, body);
  return response;
}

export async function deleteVendorRisk({
  id,
}: {
  id: number;
}): Promise<ApiResponse<null>> {
  const response = await apiServices.delete<null>(`/vendorRisks/${id}`);
  return response;
}

