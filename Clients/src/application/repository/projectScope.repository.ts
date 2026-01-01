import { apiServices, ApiResponse } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";

/**
 * Project scope structure
 */
interface ProjectScope {
  id: number;
  project_id?: number;
  name?: string;
  description?: string;
  in_scope?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Project scope input for create/update
 */
interface ProjectScopeInput {
  project_id?: number;
  name?: string;
  description?: string;
  in_scope?: boolean;
  [key: string]: unknown;
}

export async function getAllProjectScopes({
  signal,
}: {
  signal?: AbortSignal;
} = {}): Promise<BackendResponse<ProjectScope[]>> {
  const response = await apiServices.get<BackendResponse<ProjectScope[]>>("/projectScopes", {
    signal,
  });
  return response.data;
}

export async function getProjectScopeById({
  id,
  signal,
}: {
  id: number;
  signal?: AbortSignal;
}): Promise<BackendResponse<ProjectScope>> {
  const response = await apiServices.get<BackendResponse<ProjectScope>>(`/projectScopes/${id}`, {
    signal,
  });
  return response.data;
}

export async function createProjectScope({
  body,
}: {
  body: ProjectScopeInput;
}): Promise<ApiResponse<BackendResponse<ProjectScope>>> {
  const response = await apiServices.post<BackendResponse<ProjectScope>>("/projectScopes", body);
  return response;
}

export async function updateProjectScope({
  id,
  body,
}: {
  id: number;
  body: ProjectScopeInput;
}): Promise<ApiResponse<BackendResponse<ProjectScope>>> {
  const response = await apiServices.put<BackendResponse<ProjectScope>>(`/projectScopes/${id}`, body);
  return response;
}

export async function deleteProjectScope({
  id,
}: {
  id: number;
}): Promise<ApiResponse<null>> {
  const response = await apiServices.delete(`/projectScopes/${id}`);
  return response;
}
