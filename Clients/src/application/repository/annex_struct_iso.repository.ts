import { GetRequestParams } from "../../domain/interfaces/iRequestParams";
import { apiServices } from "../../infrastructure/api/networkServices";

export async function GetAllAnnexes({
  routeUrl,
  signal,
  responseType = "json",
}: GetRequestParams): Promise<any> {
  const response = await apiServices.get(routeUrl, {
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
  responseType = "json",
}: GetRequestParams): Promise<any> {
  const response = await apiServices.get(routeUrl, {
    signal,
    responseType,
  });
  return {
    status: response.status,
    data: response.data,
  };
}

export async function GetAnnexControlISO27001ById({
  routeUrl,
  signal,
  responseType = "json",
}: GetRequestParams): Promise<any> {
  const response = await apiServices.get(routeUrl, {
    signal,
    responseType,
  });
  return response.data;
}
