import { apiServices, ApiResponse } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";

/**
 * Control category structure
 */
interface ControlCategory {
  id: number;
  name: string;
  description?: string;
  order_id?: number;
  project_id?: number;
  [key: string]: unknown;
}

/**
 * Control category input for create/update
 */
interface ControlCategoryInput {
  name?: string;
  description?: string;
  order_id?: number;
  project_id?: number;
  [key: string]: unknown;
}

export async function getControlCategoryById({
  id,
  signal,
  responseType = "json",
}: {
  id: number;
  signal?: AbortSignal;
  responseType?: string;
}): Promise<BackendResponse<ControlCategory>> {
  const response = await apiServices.get<BackendResponse<ControlCategory>>(`/controlCategory/${id}`, {
    signal,
    responseType,
  });
  return response.data;
}

export async function createControlCategory({
  body,
}: {
  body: ControlCategoryInput;
}): Promise<ApiResponse<BackendResponse<ControlCategory>>> {
  const response = await apiServices.post<BackendResponse<ControlCategory>>("/controlCategory", body, {
  });
  return response;
}

export async function updateControlCategory({
  id,
  body,
}: {
  id: number;
  body: ControlCategoryInput;
}): Promise<ApiResponse<BackendResponse<ControlCategory>>> {
  const response = await apiServices.patch<BackendResponse<ControlCategory>>(`/controlCategory/${id}`, body);
  return response;
}

export async function deleteControlCategory({
  id,
}: {
  id: number;
}): Promise<ApiResponse<null>> {
  const response = await apiServices.delete<null>(`/controlCategory/${id}`);
  return response;
}

export async function getAllControlCategories(): Promise<BackendResponse<ControlCategory[]>> {
  const response = await apiServices.get<BackendResponse<ControlCategory[]>>("/controlCategory");
  return response.data;
}

export async function getControlCategoriesByProjectId({
  projectId,
  signal,
}: {
  projectId: number;
  signal?: AbortSignal;
}): Promise<BackendResponse<ControlCategory[]>> {
  const response = await apiServices.get<BackendResponse<ControlCategory[]>>(`/controlCategory/byprojectid/${projectId}`, {
    signal,
  });
  return response.data;
}
