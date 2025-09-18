import { apiServices } from "../../infrastructure/api/networkServices";

export async function getSlackIntegrations({
  id,
  signal,
  responseType = "json",
}: {
  id: number;
  signal?: AbortSignal;
  responseType?: string;
}): Promise<any> {
  const response = await apiServices.get(`/slackWebhooks`, {
    id,
    signal,
    responseType,
  });
  return response.data;
}

export async function getSlackIntegrationById({
  id,
  signal,
  responseType = "json",
}: {
  id: string;
  signal?: AbortSignal;
  responseType?: string;
}): Promise<any> {
  const response = await apiServices.get(`/slackWebhooks/${id}`, {
    signal,
    responseType,
  });
  return response.data;
}

export async function createSlackIntegration({
  body,
}: {
  body: any;
}): Promise<any> {
  const response = await apiServices.post("/slackWebhooks", body);
  return response.data;
}

export async function updateSlackIntegration({
  id,
  body,
}: {
  id: string;
  body: any;
}): Promise<any> {
  const response = await apiServices.patch(`/slackWebhooks/${id}`, body);
  return response;
}
