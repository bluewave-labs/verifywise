import { apiServices, ApiResponse } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";

/**
 * Question structure
 */
interface Question {
  id: number;
  text?: string;
  description?: string;
  category?: string;
  order?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Question input for create/update
 */
interface QuestionInput {
  text?: string;
  description?: string;
  category?: string;
  order?: number;
  [key: string]: unknown;
}

/**
 * EU AI Act answer structure
 */
interface EUAIActAnswer {
  id: number;
  question_id?: number;
  answer?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export async function getQuestionById({
  id,
  signal,
  responseType = "json",
}: {
  id: number;
  signal?: AbortSignal;
  responseType?: string;
}): Promise<BackendResponse<Question>> {
  const response = await apiServices.get<BackendResponse<Question>>(`/questions/${id}`, {
    signal,
    responseType,
  });
  return response.data;
}

export async function createQuestion({ body }: { body: QuestionInput }): Promise<ApiResponse<BackendResponse<Question>>> {
  const response = await apiServices.post<BackendResponse<Question>>("/questions", body);
  return response;
}

export async function updateQuestion({
  id,
  body,
}: {
  id: number;
  body: QuestionInput;
}): Promise<ApiResponse<BackendResponse<Question>>> {
  const response = await apiServices.patch<BackendResponse<Question>>(`/questions/${id}`, body);
  return response;
}

export async function deleteQuestion({ id }: { id: number }): Promise<ApiResponse<null>> {
  const response = await apiServices.delete(`/questions/${id}`);
  return response;
}

export async function updateEUAIActAnswerById({
  answerId,
  body,
}: {
  answerId: number;
  body: FormData | Record<string, unknown>;
}): Promise<ApiResponse<BackendResponse<EUAIActAnswer>>> {
  try {
    // Match the pattern used by ISO27001/ISO42001 drawers
    // When sending FormData, set Content-Type to multipart/form-data
    // Axios will automatically add the boundary parameter
    const headers: Record<string, string> = {};
    if (body instanceof FormData) {
      headers["Content-Type"] = "multipart/form-data";
    } else {
      headers["Content-Type"] = "application/json";
    }

    const response = await apiServices.patch<BackendResponse<EUAIActAnswer>>(
      `/eu-ai-act/saveAnswer/${answerId}`,
      body,
      { headers }
    );
    return response;
  } catch (error: unknown) {
    throw error;
  }
}
