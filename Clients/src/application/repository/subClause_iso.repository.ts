import { GetRequestParams } from "../../domain/interfaces/iRequestParams";
import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/auth/getAuthToken";

export async function GetSubClausesById({
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

export async function getSubClauseById({ subClauseId, projectFrameworkId, authToken = getAuthToken() }: { subClauseId: number; projectFrameworkId: number; authToken?: string }): Promise<any> {
  const response = await apiServices.get(`/iso-42001/subClause/byId/${subClauseId}?projectFrameworkId=${projectFrameworkId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response.data;
}

// Update subclause by ID (with file upload)
export const updateSubClauseById = async ({ subClauseId, formData }: { subClauseId: number, formData: FormData }) => {
  const token = getAuthToken();
  const response = await apiServices.patch(`/iso-42001/saveClauses/${subClauseId}`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response;

};


