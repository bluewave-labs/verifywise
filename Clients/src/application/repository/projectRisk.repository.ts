import { apiServices, ApiResponse } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";

/**
 * Project risk structure
 */
interface ProjectRisk {
  id: number;
  project_id?: number;
  framework_id?: number;
  title?: string;
  description?: string;
  severity?: string;
  likelihood?: string;
  status?: string;
  mitigation_status?: string;
  risk_level?: string;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Project risk input for create/update
 */
interface ProjectRiskInput {
  project_id?: number;
  framework_id?: number;
  title?: string;
  description?: string;
  severity?: string;
  likelihood?: string;
  status?: string;
  mitigation_status?: string;
  risk_level?: string;
  [key: string]: unknown;
}

export async function getProjectRiskById({
  id,
  signal,
}: {
  id: number;
  signal?: AbortSignal;
}): Promise<BackendResponse<ProjectRisk>> {
  const response = await apiServices.get<BackendResponse<ProjectRisk>>(`/projectRisks/${id}`, {
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
} = {}): Promise<BackendResponse<ProjectRisk[]>> {
  const response = await apiServices.get<BackendResponse<ProjectRisk[]>>(`/projectRisks?filter=${filter}`, {
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
}): Promise<BackendResponse<ProjectRisk[]>> {
  const response = await apiServices.get<BackendResponse<ProjectRisk[]>>(`/projectRisks/by-projid/${projectId}?filter=${filter}`, {
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
}): Promise<BackendResponse<ProjectRisk[]>> {
  const response = await apiServices.get<BackendResponse<ProjectRisk[]>>(`/projectRisks/by-frameworkid/${frameworkId}?filter=${filter}`, {
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
}): Promise<BackendResponse<ProjectRisk[]>> {
  const response = await apiServices.get<BackendResponse<ProjectRisk[]>>(`/projectRisks/by-projid/non-mitigated/${projectId}`, {
    signal,
  });
  return response.data;
}

export async function createProjectRisk({
  body,
}: {
  body: ProjectRiskInput;
}): Promise<ApiResponse<BackendResponse<ProjectRisk>>> {
  const response = await apiServices.post<BackendResponse<ProjectRisk>>("/projectRisks", body);
  return response;
}

export async function updateProjectRisk({
  id,
  body,
}: {
  id: number;
  body: ProjectRiskInput;
}): Promise<ApiResponse<BackendResponse<ProjectRisk>>> {
  const response = await apiServices.put<BackendResponse<ProjectRisk>>(`/projectRisks/${id}`, body);
  return response;
}

export async function deleteProjectRisk({
  id,
}: {
  id: number;
}): Promise<ApiResponse<null>> {
  const response = await apiServices.delete(`/projectRisks/${id}`);
  return response;
}
