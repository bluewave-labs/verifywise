import { apiServices } from "../../infrastructure/api/networkServices";
import { ProjectRisk } from "../../domain/types/ProjectRisk";
import { AxiosResponse } from "axios";

type CreateProjectRiskInput = Partial<Omit<ProjectRisk, 'id'>>;
type UpdateProjectRiskInput = Partial<Omit<ProjectRisk, 'id'>>;

interface ProjectRiskResponse {
  data: ProjectRisk[];
}

export async function getProjectRiskById({
  id,
  signal,
}: {
  id: number;
  signal?: AbortSignal;
}): Promise<ProjectRisk> {
  const response = await apiServices.get<ProjectRisk>(`/projectRisks/${id}`, {
    signal,
  });
  return response.data;
}

export async function getAllProjectRisks({
  signal,
  filter = 'active',
}: {
  signal?: AbortSignal;
  filter?: 'active' | 'deleted' | 'all';
} = {}): Promise<ProjectRisk[]> {
  const response = await apiServices.get<ProjectRisk[]>(`/projectRisks?filter=${filter}`, {
    signal,
  });
  return response.data;
}

export async function getAllProjectRisksByProjectId({
  projectId,
  signal,
  filter = 'active',
}: {
  projectId: string;
  signal?: AbortSignal;
  filter?: 'active' | 'deleted' | 'all';
}): Promise<ProjectRiskResponse> {
  const response = await apiServices.get<ProjectRiskResponse>(`/projectRisks/by-projid/${projectId}?filter=${filter}`, {
    signal,
  });
  return response.data;
}

export async function getAllRisksByFrameworkId({
  frameworkId,
  signal,
  filter = 'active',
}: {
  frameworkId: number;
  signal?: AbortSignal;
  filter?: 'active' | 'deleted' | 'all';
}): Promise<ProjectRisk[]> {
  const response = await apiServices.get<ProjectRisk[]>(`/projectRisks/by-frameworkid/${frameworkId}?filter=${filter}`, {
    signal,
  });
  return response.data;
}

export async function getNonMitigatedProjectRisks({
  projectId,
  signal,
}: {
  projectId: number;
  signal?: AbortSignal;
}): Promise<ProjectRisk[]> {
  const response = await apiServices.get<ProjectRisk[]>(`/projectRisks/by-projid/non-mitigated/${projectId}`, {
    signal,
  });
  return response.data;
}

export async function createProjectRisk({
  body,
}: {
  body: CreateProjectRiskInput;
}): Promise<AxiosResponse<ProjectRisk>> {
  const response = await apiServices.post<ProjectRisk>("/projectRisks", body);
  return response;
}

export async function updateProjectRisk({
  id,
  body,
}: {
  id: number;
  body: UpdateProjectRiskInput;
}): Promise<AxiosResponse<ProjectRisk>> {
  const response = await apiServices.put<ProjectRisk>(`/projectRisks/${id}`, body);
  return response;
}

export async function deleteProjectRisk({
  id,
}: {
  id: number;
}): Promise<AxiosResponse> {
  const response = await apiServices.delete(`/projectRisks/${id}`);
  return response;
}
