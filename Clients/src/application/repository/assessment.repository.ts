

import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/auth/getAuthToken";

export async function getAssessmentById({
  id,
  signal,
  authToken = getAuthToken(),
  responseType = "json",
}: {
  id: string;
  signal?: AbortSignal;
  authToken?: string;
  responseType?: string;
}): Promise<any> {
  const response = await apiServices.get(`/assessments/${id}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
    responseType,
  });
  return response.data;
}

export async function createAssessment({
  body,
  authToken = getAuthToken(),
}: {
  body: any;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.post("/assessments", body, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}

export async function updateAssessment({
  id,
  body,
  authToken = getAuthToken(),
}: {
  id: string;
  body: any;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.patch(`/assessments/${id}`, body, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}

export async function deleteAssessment({
  id,
  authToken = getAuthToken(),
}: {
  id: string;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.delete(`/assessments/${id}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}

export async function getAssessmentProgress({
  projectFrameworkId,
  signal,
  authToken = getAuthToken(),
}: {
  projectFrameworkId: number;
  signal?: AbortSignal;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.get(`/eu-ai-act/assessments/progress/${projectFrameworkId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return response.data;
}

export async function getAssessmentAnswers({
  assessmentId,
  authToken = getAuthToken(),
}: {
  assessmentId: string;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.get(`/assessments/getAnswers/${assessmentId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response.data;
}

export async function getAssessmentTopicById({
  topicId,
  projectFrameworkId,
  signal,
  authToken = getAuthToken(),
}: {
  topicId: number;
  projectFrameworkId?: number;
  signal?: AbortSignal;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.get(`/eu-ai-act/topicById?topicId=${topicId}&projectFrameworkId=${projectFrameworkId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return response.data;
}

export async function getAllAssessmentTopics({
  signal,
  authToken = getAuthToken(),
}: {
  signal?: AbortSignal;
  authToken?: string;
} = {}): Promise<any> {
  const response = await apiServices.get(`/eu-ai-act/topics`, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return response.data;
}
