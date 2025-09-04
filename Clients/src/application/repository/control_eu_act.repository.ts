import { apiServices } from "../../infrastructure/api/networkServices";

export async function getControlById({
  id,
  signal,
  responseType = "json",
}: {
  id: number;
  signal?: AbortSignal;
  responseType?: string;
}): Promise<any> {
  const response = await apiServices.get(`/controls/${id}`, {
    signal,
    responseType,
  });
  return response.data;
}

export async function createControl({
  body,
}: {
  body: any;
}): Promise<any> {
  const response = await apiServices.post("/controls", body);
  return response;
}


export async function deleteControl({
  id,
}: {
  id: number;
}): Promise<any> {
  const response = await apiServices.delete(`/controls/${id}`);
  return response;
}

export async function getControlByIdAndProject({
  controlId,
  projectFrameworkId,
  signal,
}: {
  controlId: number;
  projectFrameworkId: number;
  signal?: AbortSignal;
}): Promise<any> {
  const response = await apiServices.get(`/eu-ai-act/controlById?controlId=${controlId}&projectFrameworkId=${projectFrameworkId}`, {
    signal,
  });
  return response.data;
}

export async function getControlCategoriesByProject({
  projectFrameworkId,
  signal,
}: {
  projectFrameworkId: number;
  signal?: AbortSignal;
}): Promise<any> {
  const response = await apiServices.get(`/eu-ai-act/controlCategories?projectFrameworkId=${projectFrameworkId}`, {
    signal,
  });
  return response.data;
}

export async function getComplianceProgress({
  projectFrameworkId,
  signal,
}: {
  projectFrameworkId: number;
  signal?: AbortSignal;
}): Promise<any> {
  const response = await apiServices.get(`/eu-ai-act/compliances/progress/${projectFrameworkId}`, {
    signal,
  });
  return response.data;
}

export async function updateControl({
  controlId,
  body,
  headers,
}: {
  controlId: number | undefined;
  body: any;
  headers?: Record<string, string>;
}): Promise<any> {
  const response = await apiServices.patch(`/eu-ai-act/saveControls/${controlId}`, body, {
    headers: { ...headers },
  });
  return response;
}

export async function getControlsByControlCategoryId({
  controlCategoryId,
  projectFrameworkId,
  signal,
}: {
  controlCategoryId: number;
  projectFrameworkId: number;
  signal?: AbortSignal;
}): Promise<any> {
  const response = await apiServices.get(`/eu-ai-act/controls/byControlCategoryId/${controlCategoryId}?projectFrameworkId=${projectFrameworkId}`, {
    signal,
  });
  return response.data;
}
