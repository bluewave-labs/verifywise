// src/repositories/policies.repository.ts

import { apiServices } from "../../infrastructure/api/networkServices";
import { APIError } from "../tools/error";
import { PolicyManagerModel } from "../../domain/models/Common/policy/policyManager.model";
import { PolicyInput } from "../../domain/interfaces/IPolicy";

function extractData<T>(response: { data: { data: T } }): T {
  return response.data.data;
}


export async function getAllPolicies(): Promise<PolicyManagerModel[]> {
  try {
    const response = await apiServices.get<{message: string; data: PolicyManagerModel[]}>("/policies");
    return extractData<PolicyManagerModel[]>(response);
  } catch (error: any) {
    throw new APIError("Failed to fetch policies", error?.response?.status, error);
  }
}

export async function getAllTags(): Promise<string[]> {
  try {
    const response = await apiServices.get<{message: string; data: string[]}>("/policies/tags");
    return extractData<string[]>(response);
  } catch (error: any) {
    throw new APIError("Failed to fetch tags", error?.response?.status, error);
  }
}

export async function getPolicyById(id: string): Promise<PolicyManagerModel> {
  try {
    const response = await apiServices.get<{message: string; data: PolicyManagerModel}>(`/policies/${id}`);
    return extractData<PolicyManagerModel>(response);
  } catch (error: any) {
    throw new APIError(`Failed to fetch policy with ID ${id}`, error?.response?.status, error);
  }
}

export async function createPolicy(input: PolicyInput): Promise<PolicyManagerModel> {
  try {
    const response = await apiServices.post<{message: string; data: PolicyManagerModel}>("/policies", input);
    return extractData<PolicyManagerModel>(response);
  } catch (error: any) {
    throw new APIError("Failed to create policy", error?.response?.status, error);
  }
}

export async function updatePolicy(id: number, input: PolicyInput): Promise<PolicyManagerModel> {
  try {
    const response = await apiServices.put<{message: string; data: PolicyManagerModel}>(`/policies/${id}`, input);
    return extractData<PolicyManagerModel>(response);
  } catch (error: any) {
    throw new APIError(`Failed to update policy with ID ${id}`, error?.response?.status, error);
  }
}

export async function deletePolicy(id: number): Promise<void> {
  try {
    await apiServices.delete(`/policies/${id}`);
  } catch (error: any) {
    throw new APIError(`Failed to delete policy with ID ${id}`, error?.response?.status, error);
  }
}