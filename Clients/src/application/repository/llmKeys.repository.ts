import { LLMKeysModel } from "../../domain/models/Common/llmKeys/llmKeys.model";
import { apiServices } from "../../infrastructure/api/networkServices";

export async function createLLMKey({
  body,
}: {body: Partial<LLMKeysModel>}): Promise<any> {
  const response = await apiServices.post("/llm-keys", body);
  return response;
}

export async function editLLMKey({
  id,
  body,
}: {id: string, body: Partial<LLMKeysModel>}): Promise<any> {
  const response = await apiServices.patch(`/llm-keys/${id}`, body);
  return response;
}

export async function getLLMKeys(): Promise<any> {
  const response = await apiServices.get("/llm-keys");
  return response;
}

export async function getLMKey(id: string): Promise<any> {
  const response = await apiServices.get(`/llm-keys/${id}`);
  return response;
}

export async function deleteLLMKey(id: string): Promise<any> {
  const response = await apiServices.delete(`/llm-keys/${id}`);
  return response;
}
