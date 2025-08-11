import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/auth/getAuthToken";

export async function generateReport({
  signal,
  authToken = getAuthToken(),
}: {
  signal?: AbortSignal;
  authToken?: string;
} = {}): Promise<any> {
  const response = await apiServices.get("/reporting/generate-report", {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return  response.data
}

export async function getAllReports({
  signal,
  authToken = getAuthToken(),
}: {
  signal?: AbortSignal;
  authToken?: string;
} = {}): Promise<any> {
  const response = await apiServices.get("/reporting/reports", {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return response.data;
}

export async function getReportById({
  id,
  signal,
  authToken = getAuthToken(),
}: {
  id: number;
  signal?: AbortSignal;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.get(`/reporting/reports/${id}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return response.data;
}

export async function downloadReport({
  reportId,
  authToken = getAuthToken(),
}: {
  reportId: number;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.get(`/reporting/download/${reportId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    responseType: "blob",
  });
  return  response.data;
}

export async function createReport({
  body,
  signal,
  authToken = getAuthToken(),
}: {
  body: any;
  signal?: AbortSignal;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.post("/reporting/reports", body, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
    responseType: "blob",
  });
  return response
}

export async function deleteReport({
  id,
  authToken = getAuthToken(),
}: {
  id: number;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.delete(`/reporting/reports/${id}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response
}