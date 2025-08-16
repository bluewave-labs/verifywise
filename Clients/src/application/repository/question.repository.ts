
import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/auth/getAuthToken";


export async function getQuestionById({
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
  const response = await apiServices.get(`/questions/${id}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
    responseType,
  });
  return response.data;
}

export async function createQuestion({
  body,
  authToken = getAuthToken(),
}: {
  body: any;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.post("/questions", body, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}

export async function updateQuestion({
  id,
  body,
  authToken = getAuthToken(),
}: {
  id: number;
  body: any;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.patch(`/questions/${id}`, body, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}

export async function deleteQuestion({
  id,
  authToken = getAuthToken(),
}: {
  id: number;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.delete(`/questions/${id}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}


export async function updateEUAIActAnswerById ({ answerId, body }: { answerId: number, body: any }): Promise<any> {
  const token = getAuthToken();
  try {
    const response = await apiServices.patch(`/eu-ai-act/saveAnswer/${answerId}`, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response;
  } catch (error: any) {
    console.log("Error updating EU AI Act answer:", error);
    throw error;
  }
};