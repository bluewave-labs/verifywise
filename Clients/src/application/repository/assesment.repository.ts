import { apiServices, ApiResponse } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";

/**
 * Assessment structure
 */
interface Assessment {
  id: number;
  project_id: number;
  name?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Assessment input for create/update
 */
interface AssessmentInput {
  project_id?: number;
  name?: string;
  status?: string;
  [key: string]: unknown;
}

/**
 * Assessment progress structure
 */
interface AssessmentProgress {
  total: number;
  completed: number;
  percentage: number;
  [key: string]: unknown;
}

/**
 * Assessment answer structure
 */
interface AssessmentAnswer {
  id: number;
  question_id: number;
  answer?: string;
  [key: string]: unknown;
}

/**
 * Assessment topic structure
 */
interface AssessmentTopic {
  id: number;
  title: string;
  description?: string;
  order_id?: number;
  [key: string]: unknown;
}

export async function getAssessmentById({
  id,
  signal,
  responseType = "json",
}: {
  id: string;
  signal?: AbortSignal;
  responseType?: string;
}): Promise<BackendResponse<Assessment>> {
  const response = await apiServices.get<BackendResponse<Assessment>>(`/assessments/project/byid/${id}`, {
    signal,
    responseType,
  });
  return response.data;
}

export async function createAssessment({
  body,
}: {
  body: AssessmentInput;
}): Promise<ApiResponse<BackendResponse<Assessment>>> {
  const response = await apiServices.post<BackendResponse<Assessment>>("/assessments", body);
  return response;
}

export async function updateAssessment({
  id,
  body,
}: {
  id: string;
  body: AssessmentInput;
}): Promise<ApiResponse<BackendResponse<Assessment>>> {
  const response = await apiServices.patch<BackendResponse<Assessment>>(`/assessments/${id}`, body);
  return response;
}

export async function deleteAssessment({
  id,
}: {
  id: string;
}): Promise<ApiResponse<null>> {
  const response = await apiServices.delete<null>(`/assessments/${id}`);
  return response;
}

export async function getAssessmentProgress({
  projectFrameworkId,
  signal,
}: {
  projectFrameworkId: number;
  signal?: AbortSignal;
}): Promise<BackendResponse<AssessmentProgress>> {
  const response = await apiServices.get<BackendResponse<AssessmentProgress>>(`/eu-ai-act/assessments/progress/${projectFrameworkId}`, {
    signal,
  });
  return response.data;
}

export async function getAssessmentAnswers({
  assessmentId,
}: {
  assessmentId: string;
}): Promise<BackendResponse<AssessmentAnswer[]>> {
  const response = await apiServices.get<BackendResponse<AssessmentAnswer[]>>(`/assessments/getAnswaers/${assessmentId}`);
  return response.data;
}

export async function getAssessmentTopicById({
  topicId,
  projectFrameworkId,
  signal,
}: {
  topicId: number;
  projectFrameworkId?: number;
  signal?: AbortSignal;
}): Promise<BackendResponse<AssessmentTopic>> {
  const response = await apiServices.get<BackendResponse<AssessmentTopic>>(`/eu-ai-act/topicById?topicId=${topicId}&projectFrameworkId=${projectFrameworkId}`, {
    signal,
  });
  return response.data;
}

export async function getAllAssessmentTopics({
  signal,
}: {
  signal?: AbortSignal;
} = {}): Promise<BackendResponse<AssessmentTopic[]>> {
  const response = await apiServices.get<BackendResponse<AssessmentTopic[]>>(`/eu-ai-act/topics`, {
    signal,
  });
  return response.data;
}
