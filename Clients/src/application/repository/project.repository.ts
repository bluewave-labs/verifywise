import { apiServices, ApiResponse } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";

/**
 * Project structure
 */
interface Project {
  id: number;
  name: string;
  description?: string;
  status?: string;
  owner_id?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Project input for create/update
 */
interface ProjectInput {
  name?: string;
  description?: string;
  status?: string;
  owner_id?: number;
  [key: string]: unknown;
}

/**
 * Project progress data structure
 */
interface ProjectProgressData {
  total?: number;
  completed?: number;
  percentage?: number;
  [key: string]: unknown;
}

export async function getAllProjects({
  signal,
}: {
  signal?: AbortSignal;
} = {}): Promise<BackendResponse<Project[]>> {
  const response = await apiServices.get<BackendResponse<Project[]>>("/projects", {
    signal,
  });
  return response.data;
}

export async function getProjectById({
  id,
  signal,
}: {
  id: string;
  signal?: AbortSignal;
}): Promise<BackendResponse<Project>> {
  const response = await apiServices.get<BackendResponse<Project>>(`/projects/${id}`, {
    signal,
  });
  return response.data;
}

export async function createProject({ body }: { body: ProjectInput }): Promise<ApiResponse<BackendResponse<Project>>> {
  const response = await apiServices.post<BackendResponse<Project>>("/projects", body);
  return response;
}

export async function updateProject({
  id,
  body,
}: {
  id: number;
  body: ProjectInput;
}): Promise<ApiResponse<BackendResponse<Project>>> {
  const response = await apiServices.patch<BackendResponse<Project>>(`/projects/${id}`, body);
  return response;
}

export async function deleteProject({ id }: { id: number }): Promise<ApiResponse<null>> {
  const response = await apiServices.delete(`/projects/${id}`);
  return response;
}

export async function getProjectProgressData({
  routeUrl,
  signal,
}: {
  routeUrl: string;
  signal?: AbortSignal;
}): Promise<BackendResponse<ProjectProgressData>> {
  const response = await apiServices.get<BackendResponse<ProjectProgressData>>(routeUrl, {
    signal,
  });
  return response.data;
}
