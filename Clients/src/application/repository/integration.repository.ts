import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/auth/getAuthToken";

export async function getAllIntegrations({
  signal,
  authToken = getAuthToken(),
}: {
  signal?: AbortSignal;
  authToken?: string;
} = {}): Promise<any> {
  const response = await apiServices.get("/integrations", {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return response.data;
}

export async function getConfluenceIntegration({
  signal,
  authToken = getAuthToken(),
}: {
  signal?: AbortSignal;
  authToken?: string;
} = {}): Promise<any> {
  const response = await apiServices.get("/integrations/confluence", {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return response.data;
}


export async function disconnectConfluence({
  authToken = getAuthToken(),
}: {
  authToken?: string;
} = {}): Promise<any> {
  const response = await apiServices.post("/integrations/confluence/disconnect", {}, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}