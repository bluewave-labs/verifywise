import { apiServices } from "../../infrastructure/api/networkServices";
import { AxiosResponse } from "axios";

interface QuestionData {
  question_text?: string;
  question_type?: string;
  [key: string]: unknown;
}

interface AnswerData {
  answer_text?: string;
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
}): Promise<unknown> {
  const response = await apiServices.get(`/questions/${id}`, {
    signal,
    responseType,
  });
  return response.data;
}

export async function createQuestion({ body }: { body: QuestionData }): Promise<AxiosResponse> {
  const response = await apiServices.post("/questions", body);
  return response;
}

export async function updateQuestion({
  id,
  body,
}: {
  id: number;
  body: QuestionData;
}): Promise<AxiosResponse> {
  const response = await apiServices.patch(`/questions/${id}`, body);
  return response;
}

export async function deleteQuestion({ id }: { id: number }): Promise<AxiosResponse> {
  const response = await apiServices.delete(`/questions/${id}`);
  return response;
}

export async function updateEUAIActAnswerById({
  answerId,
  body,
}: {
  answerId: number;
  body: AnswerData | FormData;
}): Promise<AxiosResponse> {
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

    const response = await apiServices.patch(
      `/eu-ai-act/saveAnswer/${answerId}`,
      body,
      { headers }
    );
    return response;
  } catch (error) {
    throw error;
  }
}
