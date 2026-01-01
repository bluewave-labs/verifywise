import { apiServices } from "../../infrastructure/api/networkServices";
import { Project } from "../../domain/types/Project";
import { AxiosResponse } from "axios";

type CreateProjectInput = Partial<Omit<Project, 'id' | 'last_updated' | 'last_updated_by'>>;
type UpdateProjectInput = Partial<Omit<Project, 'id'>>;

interface ProgressData {
  completed: number;
  total: number;
  percentage: number;
}

export async function getAllProjects({
  signal,
}: {
  signal?: AbortSignal;
} = {}): Promise<Project[]> {
  const response = await apiServices.get<Project[]>("/projects", {
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
}): Promise<Project> {
  const response = await apiServices.get<Project>(`/projects/${id}`, {
    signal,
  });
  return response.data;
}

export async function createProject({ body }: { body: CreateProjectInput }): Promise<AxiosResponse<Project>> {
  const response = await apiServices.post<Project>("/projects", body);
  return response;
}

export async function updateProject({
  id,
  body,
}: {
  id: number;
  body: UpdateProjectInput;
}): Promise<AxiosResponse<Project>> {
  const response = await apiServices.patch<Project>(`/projects/${id}`, body);
  return response;
}

export async function deleteProject({ id }: { id: number }): Promise<AxiosResponse> {
  const response = await apiServices.delete(`/projects/${id}`);
  return response;
}

export async function getProjectProgressData({
  routeUrl,
  signal,
}: {
  routeUrl: string;
  signal?: AbortSignal;
}): Promise<ProgressData> {
  const response = await apiServices.get<ProgressData>(routeUrl, {
    signal,
  });
  return response.data;
}
