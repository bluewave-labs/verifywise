import { GetRequestParams } from "../../domain/interfaces/iRequestParams";
import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/auth/getAuthToken";

export async function GetClausesByProjectFrameworkId({
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
  return response.data;
}

export async function Iso27001GetClauseStructByFrameworkID({
  routeUrl, // Example: /api/iso27001/clauses/struct/byProjectId/1
  signal,
  authToken = getAuthToken(),
  responseType = "json",
}: GetRequestParams): Promise<any> {
  const response = await apiServices.get(routeUrl, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
    responseType,
  });
  return response;
}
