import { GetRequestParams } from "../../domain/interfaces/i.requestParams";
import { apiServices, ApiResponse } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";

/**
 * Clause structure
 */
interface Clause {
  id: number;
  title: string;
  description?: string;
  order_id?: number;
  framework_id?: number;
  [key: string]: unknown;
}

export async function GetClausesByProjectFrameworkId({
  routeUrl,
  signal,
  responseType = "json",
}: GetRequestParams): Promise<BackendResponse<Clause[]>> {
  const response = await apiServices.get<BackendResponse<Clause[]>>(routeUrl, {
    signal,
    responseType,
  });
  return response.data;
}

export async function Iso27001GetClauseStructByFrameworkID({
  routeUrl, // Example: /api/iso27001/clauses/struct/byProjectId/1
  signal,
  responseType = "json",
}: GetRequestParams): Promise<ApiResponse<BackendResponse<Clause[]>>> {
  const response = await apiServices.get<BackendResponse<Clause[]>>(routeUrl, {
    signal,
    responseType,
  });
  return response;
}
