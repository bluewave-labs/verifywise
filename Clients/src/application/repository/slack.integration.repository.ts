import { apiServices, ApiResponse } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";

/**
 * Slack integration structure
 */
interface SlackIntegration {
  id: number;
  user_id: number;
  channel?: string;
  webhook_url?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Slack integration input for create/update
 */
interface SlackIntegrationInput {
  user_id?: number;
  channel?: string;
  webhook_url?: string;
  is_active?: boolean;
  [key: string]: unknown;
}

/**
 * Slack message response
 */
interface SlackMessageResponse {
  success: boolean;
  message?: string;
  [key: string]: unknown;
}

export async function getSlackIntegrations({
  id,
  channel,
  signal,
  responseType = "json",
}: {
  id: number;
  channel?: string;
  signal?: AbortSignal;
  responseType?: string;
}): Promise<BackendResponse<SlackIntegration[]>> {
  const response = await apiServices.get<BackendResponse<SlackIntegration[]>>(`/slackWebhooks`, {
    userId: id,
    channel,
    signal,
    responseType,
  });
  return response.data;
}

export async function getSlackIntegrationById({
  id,
  signal,
  responseType = "json",
}: {
  id: number;
  signal?: AbortSignal;
  responseType?: string;
}): Promise<BackendResponse<SlackIntegration>> {
  const response = await apiServices.get<BackendResponse<SlackIntegration>>(`/slackWebhooks/${id}`, {
    signal,
    responseType,
  });
  return response.data;
}

export async function createSlackIntegration({
  body,
}: {
  body: SlackIntegrationInput;
}): Promise<BackendResponse<SlackIntegration>> {
  const response = await apiServices.post<BackendResponse<SlackIntegration>>("/slackWebhooks", body);
  return response.data;
}

export async function updateSlackIntegration({
  id,
  body,
}: {
  id: number;
  body: SlackIntegrationInput;
}): Promise<ApiResponse<BackendResponse<SlackIntegration>>> {
  const response = await apiServices.patch<BackendResponse<SlackIntegration>>(`/slackWebhooks/${id}`, body);
  return response;
}

export async function sendSlackMessage({ id }: { id: number }): Promise<BackendResponse<SlackMessageResponse>> {
  const messageBody = {
    title: "Welcome to Verifywise",
    message: "This is a test message from VerifyWise.",
  };
  const response = await apiServices.post<BackendResponse<SlackMessageResponse>>(
    `/slackWebhooks/${id}/send`,
    messageBody,
  );
  return response.data;
}

export async function deleteSlackIntegration({id,}: {
  id: number;
}): Promise<BackendResponse<null>> {
  try {
    const response = await apiServices.delete<BackendResponse<null>>(`/slackWebhooks/${id}`);
    return response.data;
  } catch (error: unknown) {
    console.error("Error deleting Slack integration:", error);
    throw error;
  }
}
