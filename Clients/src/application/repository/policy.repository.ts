// src/repositories/policies.repository.ts

import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/auth/getAuthToken";
import { Policy, PolicyInput } from "../../domain/types/Policy";
import { APIError } from "../tools/error";

const authHeader = (token?: string) => ({
  headers: { Authorization: `Bearer ${token ?? getAuthToken()}` },
});

function extractData<T>(response: { data: { data: T } }): T {
  return response.data.data;
}


export async function getAllPolicies(authToken?: string): Promise<Policy[]> {
  try {
    const response = await apiServices.get<{message: string; data: Policy[]}>("/policies", authHeader(authToken));
    return extractData<Policy[]>(response);
  } catch (error: any) {
    throw new APIError("Failed to fetch policies", error?.response?.status, error);
  }
}

export async function getAllTags(authToken?: string): Promise<string[]> {
  try {
    const response = await apiServices.get<{message: string; data: string[]}>("/policies/tags", authHeader(authToken));
    return extractData<string[]>(response);
  } catch (error: any) {
    throw new APIError("Failed to fetch tags", error?.response?.status, error);
  }
}

export async function getPolicyById(id: string, authToken?: string): Promise<Policy> {
  try {
    const response = await apiServices.get<{message: string; data: Policy}>(`/policies/${id}`, authHeader(authToken));
    return extractData<Policy>(response);
  } catch (error: any) {
    throw new APIError(`Failed to fetch policy with ID ${id}`, error?.response?.status, error);
  }
}

export async function createPolicy(input: PolicyInput, authToken?: string): Promise<Policy> {
  try {
    const response = await apiServices.post<{message: string; data: Policy}>("/policies", input, authHeader(authToken));
    return extractData<Policy>(response);
  } catch (error: any) {
    throw new APIError("Failed to create policy", error?.response?.status, error);
  }
}

export async function updatePolicy(id: string, input: PolicyInput, authToken?: string): Promise<Policy> {
  try {
    const response = await apiServices.put<{message: string; data: Policy}>(`/policies/${id}`, input, authHeader(authToken));
    return extractData<Policy>(response);
  } catch (error: any) {
    throw new APIError(`Failed to update policy with ID ${id}`, error?.response?.status, error);
  }
}

export async function deletePolicy(id: string, authToken?: string): Promise<void> {
  try {
    await apiServices.delete(`/policies/${id}`, authHeader(authToken));
  } catch (error: any) {
    throw new APIError(`Failed to delete policy with ID ${id}`, error?.response?.status, error);
  }
}