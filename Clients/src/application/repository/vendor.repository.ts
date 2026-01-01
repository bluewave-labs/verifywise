import { apiServices, ApiResponse } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";
import { VendorModel } from "../../domain/models/Common/vendor/vendor.model";

/**
 * Input type for creating a new vendor
 */
type CreateVendorInput = Partial<Omit<VendorModel, "id">>;

/**
 * Input type for updating a vendor
 */
type UpdateVendorInput = Partial<Omit<VendorModel, "id">>;

export async function getAllVendors({
  signal,
}: {
  signal?: AbortSignal;
} = {}): Promise<BackendResponse<VendorModel[]>> {
  const response = await apiServices.get<BackendResponse<VendorModel[]>>("/vendors", {
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
}): Promise<BackendResponse<VendorModel>> {
  const response = await apiServices.get<BackendResponse<VendorModel>>(`/vendors/${id}`, {
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
}): Promise<BackendResponse<VendorModel[]>> {
  const response = await apiServices.get<BackendResponse<VendorModel[]>>(`/vendors/project-id/${projectId}`, {
    signal,
  });
  return response.data;
}

export async function createNewVendor({
  body,
}: {
  body: CreateVendorInput;
}): Promise<ApiResponse<BackendResponse<VendorModel>>> {
  const response = await apiServices.post<BackendResponse<VendorModel>>("/vendors", body);
  return response;
}

export async function update({
  id,
  body,
}: {
  id: number;
  body: UpdateVendorInput;
}): Promise<ApiResponse<BackendResponse<VendorModel>>> {
  const response = await apiServices.patch<BackendResponse<VendorModel>>(`/vendors/${id}`, body);
  return response;
}

export async function deleteVendor({
  id,
}: {
  id: number;
}): Promise<ApiResponse<BackendResponse<null>>> {
  const response = await apiServices.delete<BackendResponse<null>>(`/vendors/${id}`);
  return response;
}