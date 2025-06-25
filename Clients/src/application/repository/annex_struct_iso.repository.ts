import { GetRequestParams } from "../../domain/interfaces/iRequestParams";
import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/getAuthToken";

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
