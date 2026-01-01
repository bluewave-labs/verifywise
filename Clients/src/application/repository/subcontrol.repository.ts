import { apiServices, ApiResponse } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";
import { Subcontrol } from "../../domain/types/Subcontrol";

/**
 * Input type for creating a subcontrol
 */
type CreateSubcontrolInput = Partial<Omit<Subcontrol, "id">>;

/**
 * Input type for updating a subcontrol
 */
type UpdateSubcontrolInput = Partial<Omit<Subcontrol, "id">>;

export async function getSubcontrolById({
  id,
  signal,
  responseType = "json",
}: {
  id: number;
  signal?: AbortSignal;
  responseType?: string;
}): Promise<BackendResponse<Subcontrol>> {
  const response = await apiServices.get<BackendResponse<Subcontrol>>(`/subcontrols/${id}`, {
    signal,
    responseType,
  });
  return response.data;
}

export async function createSubcontrol({
  body,
}: {
  body: CreateSubcontrolInput;
}): Promise<ApiResponse<BackendResponse<Subcontrol>>> {
  const response = await apiServices.post<BackendResponse<Subcontrol>>("/subcontrols", body);
  return response;
}

export async function updateSubcontrol({
  id,
  body,
}: {
  id: number;
  body: UpdateSubcontrolInput;
}): Promise<ApiResponse<BackendResponse<Subcontrol>>> {
  const response = await apiServices.patch<BackendResponse<Subcontrol>>(`/subcontrols/${id}`, body);
  return response;
}

export async function deleteSubcontrol({
  id,
}: {
  id: number;
}): Promise<ApiResponse<BackendResponse<null>>> {
  const response = await apiServices.delete<BackendResponse<null>>(`/subcontrols/${id}`);
  return response;
}
