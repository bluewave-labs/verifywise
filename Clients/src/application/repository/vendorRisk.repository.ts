import { apiServices } from "../../infrastructure/api/networkServices";
import { VendorRisk, CreateVendorRiskInput, UpdateVendorRiskInput } from "../../domain/types/VendorRisk";
import { AxiosResponse } from "axios";

export async function getAllVendorRisks({
  signal,
  filter = 'active',
}: {
  signal?: AbortSignal;
  filter?: 'active' | 'deleted' | 'all';
} = {}): Promise<VendorRisk[]> {
  const response = await apiServices.get<VendorRisk[]>(`/vendorRisks/all?filter=${filter}`, {
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
}): Promise<VendorRisk[]> {
  const response = await apiServices.get<VendorRisk[]>(`/vendorRisks/by-projid/${projectId}?filter=${filter}`, {
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
}): Promise<VendorRisk[]> {
  const response = await apiServices.get<VendorRisk[]>(`/vendorRisks/by-vendorid/${vendorId}?filter=${filter}`, {
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
}): Promise<VendorRisk> {
  const response = await apiServices.get<VendorRisk>(`/vendorRisks/${id}`, {
    signal,
  });
  return response.data;
}

export async function createVendorRisk({
  body,
}: {
  body: CreateVendorRiskInput;
}): Promise<AxiosResponse<VendorRisk>> {
  const response = await apiServices.post<VendorRisk>("/vendorRisks", body);
  return response;
}

export async function updateVendorRisk({
  id,
  body,
}: {
  id: number;
  body: UpdateVendorRiskInput;
}): Promise<AxiosResponse<VendorRisk>> {
  const response = await apiServices.put<VendorRisk>(`/vendorRisks/${id}`, body);
  return response;
}

export async function deleteVendorRisk({
  id,
}: {
  id: number;
}): Promise<AxiosResponse> {
  const response = await apiServices.delete(`/vendorRisks/${id}`);
  return response;
}

