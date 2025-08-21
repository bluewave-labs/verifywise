import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/auth/getAuthToken";

export async function getControlCategoryById({
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
  const response = await apiServices.get(`/controlCategory/${id}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
    responseType,
  });
  return response.data;
}

export async function createControlCategory({
  body,
  authToken = getAuthToken(),
}: {
  body: any;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.post("/controlCategory", body, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}

export async function updateControlCategory({
  id,
  body,
  authToken = getAuthToken(),
}: {
  id: number;
  body: any;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.patch(`/controlCategory/${id}`, body, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}

export async function deleteControlCategory({
  id,
  authToken = getAuthToken(),
}: {
  id: number;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.delete(`/controlCategory/${id}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}

export async function getAllControlCategories({
  authToken = getAuthToken(),
}: {
  authToken?: string;
} = {}): Promise<any> {
  const response = await apiServices.get("/controlCategory", {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response.data;
}

export async function getControlCategoriesByProjectId({
  projectId,
  signal,
  authToken = getAuthToken(),
}: {
  projectId: number;
  signal?: AbortSignal;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.get(`/controlCategory/byprojectid/${projectId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return response.data;
}
