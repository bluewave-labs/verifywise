import { apiServices, ApiResponse } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";
import { Subtopic } from "../../domain/types/Subtopic";

/**
 * Input type for creating a subtopic
 */
type CreateSubtopicInput = Partial<Omit<Subtopic, "id">>;

/**
 * Input type for updating a subtopic
 */
type UpdateSubtopicInput = Partial<Omit<Subtopic, "id">>;

export async function getSubtopicById({
  id,
  signal,
  responseType = "json",
}: {
  id: number;
  signal?: AbortSignal;
  responseType?: string;
}): Promise<BackendResponse<Subtopic>> {
  const response = await apiServices.get<BackendResponse<Subtopic>>(`/subtopics/${id}`, {
    signal,
    responseType,
  });
  return response.data;
}

export async function createSubtopic({
  body,
}: {
  body: CreateSubtopicInput;
}): Promise<ApiResponse<BackendResponse<Subtopic>>> {
  const response = await apiServices.post<BackendResponse<Subtopic>>("/subtopics", body);
  return response;
}

export async function updateSubtopic({
  id,
  body,
}: {
  id: number;
  body: UpdateSubtopicInput;
}): Promise<ApiResponse<BackendResponse<Subtopic>>> {
  const response = await apiServices.patch<BackendResponse<Subtopic>>(`/subtopics/${id}`, body);
  return response;
}

export async function deleteSubtopic({
  id,
}: {
  id: number;
}): Promise<ApiResponse<null>> {
  const response = await apiServices.delete<null>(`/subtopics/${id}`);
  return response;
}
