import { apiServices } from "../../infrastructure/api/networkServices";

export async function getAllApprovalWorkflows({
  signal,
}: {
  signal?: AbortSignal;
} = {}): Promise<any> {
  const response = await apiServices.get("/approval-workflows", {
    signal,
  });
  return response.data;
}

export async function getApprovalWorkflowById({
  id,
  signal,
}: {
  id: number;
  signal?: AbortSignal;
}): Promise<any> {
  const response = await apiServices.get(`/approval-workflows/${id}`, {
    signal,
  });
  return response.data;
}

export async function createApprovalWorkflow({
  body,
}: {
  body: any;
}): Promise<any> {
  const response = await apiServices.post("/approval-workflows", body);
  return response;
}

export async function updateApprovalWorkflow({
  id,
  body,
}: {
  id: number;
  body: any;
}): Promise<any> {
  const response = await apiServices.put(`/approval-workflows/${id}`, body);
  return response;
}

export async function deleteApprovalWorkflow({
  id,
}: {
  id: number;
}): Promise<any> {
  const response = await apiServices.delete(`/approval-workflows/${id}`);
  return response;
}
