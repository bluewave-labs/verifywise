import { LLMKeysModel } from "../../domain/models/Common/llmKeys/llmKeys.model";
import { apiServices, ApiResponse } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";

export async function createLLMKey({
  body,
}: {body: Partial<LLMKeysModel>}): Promise<ApiResponse<BackendResponse<LLMKeysModel>>> {
  const response = await apiServices.post<BackendResponse<LLMKeysModel>>("/llm-keys", body);
  return response;
}

export async function editLLMKey({
  id,
  body,
}: {id: string, body: Partial<LLMKeysModel>}): Promise<ApiResponse<BackendResponse<LLMKeysModel>>> {
  const response = await apiServices.patch<BackendResponse<LLMKeysModel>>(`/llm-keys/${id}`, body);
  return response;
}

export async function getLLMKeys(): Promise<ApiResponse<BackendResponse<LLMKeysModel[]>>> {
  const response = await apiServices.get<BackendResponse<LLMKeysModel[]>>("/llm-keys");
  return response;
}

export async function getLLMKey(name: string): Promise<ApiResponse<BackendResponse<LLMKeysModel>>> {
  const response = await apiServices.get<BackendResponse<LLMKeysModel>>(`/llm-keys/${name}`);
  return response;
}

export async function deleteLLMKey(id: string): Promise<ApiResponse<null>> {
  const response = await apiServices.delete<null>(`/llm-keys/${id}`);
  return response;
}
