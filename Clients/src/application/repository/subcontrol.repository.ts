import { apiServices } from "../../infrastructure/api/networkServices";
import { AxiosResponse } from "axios";

interface Subcontrol {
  id: number;
  title: string;
  description?: string;
  control_id?: number;
  status?: string;
  owner?: number;
  order_no?: number;
}

type CreateSubcontrolInput = Partial<Omit<Subcontrol, 'id'>>;
type UpdateSubcontrolInput = Partial<Omit<Subcontrol, 'id'>>;

export async function getSubcontrolById({
  id,
  signal,
  responseType = "json",
}: {
  id: number;
  signal?: AbortSignal;
  responseType?: string;
}): Promise<Subcontrol> {
  const response = await apiServices.get<Subcontrol>(`/subcontrols/${id}`, {
    signal,
    responseType,
  });
  return response.data;
}

export async function createSubcontrol({
  body,
}: {
  body: CreateSubcontrolInput;
}): Promise<AxiosResponse<Subcontrol>> {
  const response = await apiServices.post<Subcontrol>("/subcontrols", body);
  return response;
}

export async function updateSubcontrol({
  id,
  body,
}: {
  id: number;
  body: UpdateSubcontrolInput;
}): Promise<AxiosResponse<Subcontrol>> {
  const response = await apiServices.patch<Subcontrol>(`/subcontrols/${id}`, body);
  return response;
}

export async function deleteSubcontrol({
  id,
}: {
  id: number;
}): Promise<AxiosResponse> {
  const response = await apiServices.delete(`/subcontrols/${id}`);
  return response;
}
