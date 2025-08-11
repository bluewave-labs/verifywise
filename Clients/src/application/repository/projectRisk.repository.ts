import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/auth/getAuthToken";

export async function getProjectRiskById({
  id,
  signal,
  authToken = getAuthToken(),
}: {
  id: number;
  signal?: AbortSignal;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.get(`/projectRisks/${id}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return response.data;
}

export async function getAllProjectRisksByProjectId({
  projectId,
  signal,
  authToken = getAuthToken(),
}: {
  projectId: string;
  signal?: AbortSignal;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.get(`/projectRisks/by-projid/${projectId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return response.data;
}

export async function getNonMitigatedProjectRisks({
  projectId,
  signal,
  authToken = getAuthToken(),
}: {
  projectId: number;
  signal?: AbortSignal;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.get(`/projectRisks/by-projid/non-mitigated/${projectId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return response.data;
}

export async function createProjectRisk({
  body,
  authToken = getAuthToken(),
}: {
  body: any;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.post("/projectRisks", body, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}

export async function updateProjectRisk({
  id,
  body,
  authToken = getAuthToken(),
}: {
  id: number;
  body: any;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.put(`/projectRisks/${id}`, body, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}

export async function deleteProjectRisk({
  id,
  authToken = getAuthToken(),
}: {
  id: number;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.delete(`/projectRisks/${id}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response
}