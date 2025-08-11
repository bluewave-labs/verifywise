import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/auth/getAuthToken";


export async function removeFrameworkFromProject({
  frameworkId,
  projectId,
  authToken = getAuthToken(),
}: {
  frameworkId: string | number;
  projectId: string | number;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.delete(
    `/frameworks/fromProject?frameworkId=${frameworkId}&projectId=${projectId}`,
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );
  return { data: response.data, status: response.status };
}

export async function getFrameworkById({
  id,
  signal,
  authToken = getAuthToken(),
  responseType = "json",
}: {
  id: number;
  signal?: AbortSignal;
  authToken?: string;
  responseType?: string;
}): Promise<any> {
  const response = await apiServices.get(`/frameworks/${id}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
    responseType,
  });
  return { data: response.data, status: response.status };
}

export async function getAllFrameworks({
  signal,
  authToken = getAuthToken(),
  responseType = "json",
}: {
  signal?: AbortSignal;
  authToken?: string;
  responseType?: string;
} = {}): Promise<any> {
  const response = await apiServices.get("/frameworks", {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
    responseType,
  });
  return { data: response.data, status: response.status };
}

export async function assignFrameworkToProject({
  frameworkId,
  projectId,
  authToken = getAuthToken(),
}: {
  frameworkId: number;
  projectId: string;
  authToken?: string;
}): Promise<any> {
  try {
    const response = await apiServices.post(
      `/frameworks/toProject?frameworkId=${frameworkId}&projectId=${projectId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    console.error("Error assigning framework to project:", error);
    throw error;
  }
}