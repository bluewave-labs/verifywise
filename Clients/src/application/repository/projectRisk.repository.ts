import { apiServices } from "../../infrastructure/api/networkServices";

export async function getProjectRiskById({
  id,
  signal,
}: {
  id: number;
  signal?: AbortSignal;
}): Promise<any> {
  const response = await apiServices.get(`/projectRisks/${id}`, {
    signal,
  });
  return response.data;
}

export async function getAllProjectRisks({
  signal,
}: {
  signal?: AbortSignal;
} = {}): Promise<any> {
  const response = await apiServices.get("/projectRisks", {
    signal,
  });
  return response.data;
}

export async function getAllProjectRisksByProjectId({
  projectId,
  signal,
}: {
  projectId: string;
  signal?: AbortSignal;
}): Promise<any> {
  const response = await apiServices.get(`/projectRisks/by-projid/${projectId}`, {
    signal,
  });
  return response.data;
}

export async function getAllRisksByFrameworkId({
  frameworkId,
  signal,
}: {
  frameworkId: number;
  signal?: AbortSignal;
}): Promise<any> {
  const response = await apiServices.get(`/projectRisks/by-frameworkid/${frameworkId}`, {
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
}): Promise<any> {
  const response = await apiServices.get(`/projectRisks/by-projid/non-mitigated/${projectId}`, {
    signal,
  });
  return response.data;
}

export async function createProjectRisk({
  body,
}: {
  body: any;
}): Promise<any> {
  const response = await apiServices.post("/projectRisks", body);
  return response;
}

export async function updateProjectRisk({
  id,
  body,
}: {
  id: number;
  body: any;
}): Promise<any> {
  const response = await apiServices.put(`/projectRisks/${id}`, body);
  return response;
}

export async function deleteProjectRisk({
  id,
}: {
  id: number;
}): Promise<any> {
  const response = await apiServices.delete(`/projectRisks/${id}`);
  return response
}