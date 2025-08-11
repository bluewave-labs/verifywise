
import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/auth/getAuthToken";

export async function getAllProjects({
  signal,
  authToken = getAuthToken(),
}: {
  signal?: AbortSignal;
  authToken?: string;
} = {}): Promise<any> {
  console.log("Fetching all projects----------------------------------------");
  const response = await apiServices.get("/projects", {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  console.log(response);
  return response.data;
}

export async function getProjectById({
  id,
  signal,
  authToken = getAuthToken(),
}: {
  id: string;
  signal?: AbortSignal;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.get(`/projects/${id}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return response.data;
}

export async function createProject({
  body,
  authToken = getAuthToken(),
}: {
  body: any;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.post("/projects", body, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}

export async function updateProject({
  id,
  body,
  authToken = getAuthToken(),
}: {
  id: number;
  body: any;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.patch(`/projects/${id}`, body, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}

export async function deleteProject({
  id,
  authToken = getAuthToken(),
}: {
  id: number;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.delete(`/projects/${id}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}


export async function getProjectProgressData({
  routeUrl,
  signal,
  authToken = getAuthToken(),
}: {
  routeUrl: string;
  signal?: AbortSignal;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.get(routeUrl, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return response.data;
}

