import { GetRequestParams } from "../../domain/interfaces/i.requestParams";
import { apiServices } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";

/**
 * Annex structure
 */
interface Annex {
  id: number;
  title: string;
  description?: string;
  order_id?: number;
  [key: string]: unknown;
}

/**
 * Annex control structure
 */
interface AnnexControl {
  id: number;
  title: string;
  description?: string;
  annex_id?: number;
  [key: string]: unknown;
}

/**
 * Custom response that includes status and data
 */
interface AnnexListResponse<T> {
  status: number;
  data: BackendResponse<T>;
}

export async function GetAllAnnexes({
  routeUrl,
  signal,
  responseType = "json",
}: GetRequestParams): Promise<AnnexListResponse<Annex[]>> {
  const response = await apiServices.get<BackendResponse<Annex[]>>(routeUrl, {
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
}: GetRequestParams): Promise<AnnexListResponse<Annex[]>> {
  const response = await apiServices.get<BackendResponse<Annex[]>>(routeUrl, {
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
}: GetRequestParams): Promise<BackendResponse<AnnexControl>> {
  const response = await apiServices.get<BackendResponse<AnnexControl>>(routeUrl, {
    signal,
    responseType,
  });
  return response.data;
}
