import { apiServices, ApiResponse } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";

/**
 * Vendor structure
 */
interface Vendor {
  id: number;
  name: string;
  description?: string;
  project_id?: number;
  status?: string;
  risk_level?: string;
  contact_name?: string;
  contact_email?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Vendor input for create/update
 */
interface VendorInput {
  name?: string;
  description?: string;
  project_id?: number;
  status?: string;
  risk_level?: string;
  contact_name?: string;
  contact_email?: string;
  [key: string]: unknown;
}

// Get all vendors
export async function getAllVendors({
  signal,
  responseType = "json",
}: {
  signal?: AbortSignal;
  responseType?: string;
} = {}): Promise<BackendResponse<Vendor[]>> {
  const response = await apiServices.get<BackendResponse<Vendor[]>>("/vendors", {
    signal,
    responseType,
  });
  return response.data;
}

// Get all vendors for a project
export async function getVendorsByProjectId({
  projectId,
  signal,
  responseType = "json",
}: {
  projectId: number;
  signal?: AbortSignal;
  responseType?: string;
}): Promise<BackendResponse<Vendor[]>> {
  const response = await apiServices.get<BackendResponse<Vendor[]>>(`/vendors/project-id/${projectId}`, {
    signal,
    responseType,
  });
  return response.data;
}

// Get a vendor by ID
export async function getVendorById({
  id,
  signal,
  responseType = "json",
}: {
  id: number;
  signal?: AbortSignal;
  responseType?: string;
}): Promise<BackendResponse<Vendor>> {
  const response = await apiServices.get<BackendResponse<Vendor>>(`/vendors/${id}`, {
    signal,
    responseType,
  });
  return response.data;
}

// Create a vendor
export async function createVendor({
  body,
}: {
  body: VendorInput;
}): Promise<ApiResponse<BackendResponse<Vendor>>> {
  const response = await apiServices.post<BackendResponse<Vendor>>("/vendors", body);
  return response;
}

// Update a vendor
export async function updateVendor({
  id,
  body,
}: {
  id: number;
  body: VendorInput;
}): Promise<ApiResponse<BackendResponse<Vendor>>> {
  const response = await apiServices.patch<BackendResponse<Vendor>>(`/vendors/${id}`, body);
  return response;
}

// Delete a vendor
export async function deleteVendor({
  id,
}: {
  id: number;
}): Promise<ApiResponse<null>> {
  const response = await apiServices.delete(`/vendors/${id}`);
  return response;
}
