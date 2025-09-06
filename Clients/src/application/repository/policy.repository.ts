// src/repositories/policies.repository.ts

import { apiServices } from "../../infrastructure/api/networkServices";
import { Policy, PolicyInput } from "../../domain/types/Policy";
import { APIError } from "../tools/error";

function extractData<T>(response: { data: { data: T } }): T {
  return response.data.data;
}


export async function getAllPolicies(): Promise<Policy[]> {
  try {
    const response = await apiServices.get<{message: string; data: Policy[]}>("/policies");
    return extractData<Policy[]>(response);
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

export async function getPolicyById(id: string): Promise<Policy> {
  try {
    const response = await apiServices.get<{message: string; data: Policy}>(`/policies/${id}`);
    return extractData<Policy>(response);
  } catch (error: any) {
    throw new APIError(`Failed to fetch policy with ID ${id}`, error?.response?.status, error);
  }
}

export async function createPolicy(input: PolicyInput): Promise<Policy> {
  try {
    const response = await apiServices.post<{message: string; data: Policy}>("/policies", input);
    return extractData<Policy>(response);
  } catch (error: any) {
    throw new APIError("Failed to create policy", error?.response?.status, error);
  }
}

export async function updatePolicy(id: string, input: PolicyInput): Promise<Policy> {
  try {
    const response = await apiServices.put<{message: string; data: Policy}>(`/policies/${id}`, input);
    return extractData<Policy>(response);
  } catch (error: any) {
    throw new APIError(`Failed to update policy with ID ${id}`, error?.response?.status, error);
  }
}

export async function deletePolicy(id: string): Promise<void> {
  try {
    await apiServices.delete(`/policies/${id}`);
  } catch (error: any) {
    throw new APIError(`Failed to delete policy with ID ${id}`, error?.response?.status, error);
  }
}