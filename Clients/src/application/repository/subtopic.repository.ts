import { apiServices } from "../../infrastructure/api/networkServices";
import { AxiosResponse } from "axios";

interface Subtopic {
  id: number;
  title: string;
  topic_id?: number;
  order_no?: number;
}

type CreateSubtopicInput = Partial<Omit<Subtopic, 'id'>>;
type UpdateSubtopicInput = Partial<Omit<Subtopic, 'id'>>;

export async function getSubtopicById({
  id,
  signal,
  responseType = "json",
}: {
  id: number;
  signal?: AbortSignal;
  responseType?: string;
}): Promise<Subtopic> {
  const response = await apiServices.get<Subtopic>(`/subtopics/${id}`, {
    signal,
    responseType,
  });
  return response.data;
}

export async function createSubtopic({
  body,
}: {
  body: CreateSubtopicInput;
}): Promise<AxiosResponse<Subtopic>> {
  const response = await apiServices.post<Subtopic>("/subtopics", body);
  return response;
}

export async function updateSubtopic({
  id,
  body,
}: {
  id: number;
  body: UpdateSubtopicInput;
}): Promise<AxiosResponse<Subtopic>> {
  const response = await apiServices.patch<Subtopic>(`/subtopics/${id}`, body);
  return response;
}

export async function deleteSubtopic({
  id,
}: {
  id: number;
}): Promise<AxiosResponse> {
  const response = await apiServices.delete(`/subtopics/${id}`);
  return response;
}
