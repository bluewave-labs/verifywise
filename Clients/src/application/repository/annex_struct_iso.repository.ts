import { GetRequestParams } from "../../domain/interfaces/iRequestParams";
import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/auth/getAuthToken";

export async function GetAllAnnexes({
  routeUrl,
  signal,
  authToken = getAuthToken(),
  responseType = "json",
}: GetRequestParams): Promise<any> {
  const response = await apiServices.get(routeUrl, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
    responseType,
  });
  return {
    status: response.status,
    data: response.data,
  };
}

export async function GetAnnexesByProjectFrameworkId({
  routeUrl,
  signal,
  authToken = getAuthToken(),
  responseType = "json",
}: GetRequestParams): Promise<any> {
  const response = await apiServices.get(routeUrl, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
    responseType,
  });
  return {
    status: response.status,
    data: response.data,
  };
}

export async function getAnnexesProgress({ projectId, authToken = getAuthToken() }: { projectId: number; authToken?: string }): Promise<any> {
  const response = await apiServices.get(`/iso-42001/annexes/progress/${projectId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response.data;
}

export async function getAnnexesStructByProjectId({ projectId, authToken = getAuthToken() }: { projectId: number; authToken?: string }): Promise<any> {
  const response = await apiServices.get(`/iso-42001/annexes/struct/byProjectId/${projectId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return {
    status: response.status,
    data: response.data,
  };
}
