import { apiServices, ApiResponse } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";

/**
 * Role structure
 */
interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: string[];
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Role input for create/update
 */
interface RoleInput {
  name?: string;
  description?: string;
  permissions?: string[];
  [key: string]: unknown;
}

export async function getAllRoles({
  signal,
}: {
  signal?: AbortSignal;
} = {}): Promise<BackendResponse<Role[]>> {
  const response = await apiServices.get<BackendResponse<Role[]>>("/roles", {
    signal,
  });
  return response.data;
}

export async function getRoleById({
  id,
  signal,
}: {
  id: number;
  signal?: AbortSignal;
}): Promise<BackendResponse<Role>> {
  const response = await apiServices.get<BackendResponse<Role>>(`/roles/${id}`, {
    signal,
  });
  return response.data;
}

export async function createRole({
  body,
}: {
  body: RoleInput;
}): Promise<ApiResponse<BackendResponse<Role>>> {
  const response = await apiServices.post<BackendResponse<Role>>("/roles", body);
  return response;
}

export async function updateRole({
  id,
  body,
}: {
  id: number;
  body: RoleInput;
}): Promise<ApiResponse<BackendResponse<Role>>> {
  const response = await apiServices.put<BackendResponse<Role>>(`/roles/${id}`, body);
  return response;
}

export async function deleteRole({
  id,
}: {
  id: number;
}): Promise<ApiResponse<null>> {
  const response = await apiServices.delete(`/roles/${id}`);
  return response;
}
