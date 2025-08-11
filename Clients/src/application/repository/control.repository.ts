import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/auth/getAuthToken";

export async function getControlById({
  id,
  signal,
  authToken = getAuthToken(),
  responseType = "json",
}: {
  id: number;
  signal?: AbortSignal;
  authToken?: string;
  responseType?: string;
}): Promise<any> {
  const response = await apiServices.get(`/controls/${id}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
    responseType,
  });
  return response.data;
}

export async function createControl({
  body,
  authToken = getAuthToken(),
}: {
  body: any;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.post("/controls", body, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}

export async function updateControl({
  id,
  body,
  authToken = getAuthToken(),
}: {
  id: number;
  body: any;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.patch(`/controls/${id}`, body, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}

export async function deleteControl({
  id,
  authToken = getAuthToken(),
}: {
  id: number;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.delete(`/controls/${id}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}

export async function getControlByIdAndProject({
  controlId,
  projectFrameworkId,
  signal,
  authToken = getAuthToken(),
}: {
  controlId: number;
  projectFrameworkId: number;
  signal?: AbortSignal;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.get(`/eu-ai-act/controlById?controlId=${controlId}&projectFrameworkId=${projectFrameworkId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return response.data;
}

export async function getControlCategoriesByProject({
  projectFrameworkId,
  signal,
  authToken = getAuthToken(),
}: {
  projectFrameworkId: number;
  signal?: AbortSignal;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.get(`/eu-ai-act/controlCategories?projectFrameworkId=${projectFrameworkId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return response.data;
}

export async function getComplianceData({
  projectFrameworkId,
  signal,
  authToken = getAuthToken(),
}: {
  projectFrameworkId: number;
  signal?: AbortSignal;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.get(`/eu-ai-act/complianceOverview?projectFrameworkId=${projectFrameworkId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return response.data;
}

export async function updateControlCompliance({
  controlId,
  body,
  authToken = getAuthToken(),
  headers,
}: {
  controlId: number | undefined;
  body: any;
  authToken?: string;
  headers?: Record<string, string>;
}): Promise<any> {
  if (!controlId) {
    throw new Error("Control ID is required for updating compliance");
  }
  const response = await apiServices.patch(`/eu-ai-act/saveControls/${controlId}`, body, {
    headers: { Authorization: `Bearer ${authToken}`, ...headers },
  });
  return response;
}

export async function getControlsByControlCategoryId({
  controlCategoryId,
  projectFrameworkId,
  signal,
  authToken = getAuthToken(),
}: {
  controlCategoryId: number;
  projectFrameworkId: number;
  signal?: AbortSignal;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.get(`/eu-ai-act/controls/byControlCategoryId/${controlCategoryId}?projectFrameworkId=${projectFrameworkId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return response.data;
}
