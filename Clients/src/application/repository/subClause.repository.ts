
import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/auth/getAuthToken";



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
  return response.data;
}


export async function getSubClauseById({ subClauseId, projectFrameworkId, authToken = getAuthToken() }: { subClauseId: number; projectFrameworkId: number; authToken?: string }): Promise<any> {
  const response = await apiServices.get(`/iso-42001/subClause/byId/${subClauseId}?projectFrameworkId=${projectFrameworkId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response.data;
}

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

export async function getAnnexCategoryById({ annexCategoryId, projectFrameworkId, authToken = getAuthToken() }: { annexCategoryId: number; projectFrameworkId: number; authToken?: string }): Promise<any> {
  const response = await apiServices.get(`/iso-42001/annexCategory/byId/${annexCategoryId}?projectFrameworkId=${projectFrameworkId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response.data;
}

export async function getClausesProgressByProjectFrameworkId(
  {
    projectFrameworkId,
    authToken = getAuthToken(),
  }: {
    projectFrameworkId: number;
    authToken?: string;
  }
): Promise<any> {
  const response = await apiServices.get(
    `/iso-42001/clauses/progress/${projectFrameworkId}`,
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );
  return response.data;
}