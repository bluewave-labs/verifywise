import { apiServices } from "../../infrastructure/api/networkServices";
import { AxiosResponse } from "axios";

interface Vendor {
  id: number;
  vendor_name: string;
  vendor_type?: string;
  website?: string;
  contact_person?: string;
  review_result?: string;
  review_status?: string;
  reviewer?: number;
  risk_status?: string;
  review_date?: string;
  assignee?: number;
  project_id?: number;
}

type CreateVendorInput = Partial<Omit<Vendor, 'id'>>;
type UpdateVendorInput = Partial<Omit<Vendor, 'id'>>;

export async function getAllVendors({
  signal,
}: {
  signal?: AbortSignal;
} = {}): Promise<Vendor[]> {
  const response = await apiServices.get<Vendor[]>("/vendors", {
    signal,
  });
  return response.data;
}

export async function getVendorById({
  id,
  signal,
}: {
  id: number;
  signal?: AbortSignal;
}): Promise<Vendor> {
  const response = await apiServices.get<Vendor>(`/vendors/${id}`, {
    signal,
  });
  return response.data;
}

export async function getVendorsByProjectId({
  projectId,
  signal,
}: {
  projectId: number;
  signal?: AbortSignal;
}): Promise<Vendor[]> {
  const response = await apiServices.get<Vendor[]>(`/vendors/project-id/${projectId}`, {
    signal,
  });
  return response.data;
}

export async function createNewVendor({
  body,
}: {
  body: CreateVendorInput;
}): Promise<AxiosResponse<Vendor>> {
  const response = await apiServices.post<Vendor>("/vendors", body);
  return response;
}

export async function update({
  id,
  body,
}: {
  id: number;
  body: UpdateVendorInput;
}): Promise<AxiosResponse<Vendor>> {
  const response = await apiServices.patch<Vendor>(`/vendors/${id}`, body);
  return response;
}

export async function deleteVendor({
  id,
}: {
  id: number;
}): Promise<AxiosResponse> {
  const response = await apiServices.delete(`/vendors/${id}`);
  return response;
}