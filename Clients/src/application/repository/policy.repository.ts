// src/repositories/policies.repository.ts

import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/auth/getAuthToken";
import { Policy, PolicyInput } from "../../domain/types/Policy";

const authHeader = (token?: string) => ({
  headers: { Authorization: `Bearer ${token ?? getAuthToken()}` },
});

export async function getAllPolicies(authToken?: string): Promise<Policy[]> {
  try {
    const { data } = await apiServices.get("/policies", authHeader(authToken)) as {
      data: {
        message: string, data: Policy[]
      }
    };
    return data.data;
  } catch (error) {
    console.error("Error fetching policies:", error);
    throw error;
  }
}

export async function getAllTags(authToken?: string): Promise<string[]> {
  try {
    const { data } = await apiServices.get("/tags", authHeader(authToken)) as {
      data: {
        message: string, data: string[]
      }
    };
    return data.data;
  } catch (error) {
    console.error("Error fetching tags:", error);
    throw error;
  }
}

export async function getPolicyById(id: string, authToken?: string): Promise<Policy> {
  try {
    const { data } = await apiServices.get(`/policies/${id}`, authHeader(authToken)) as {
      data: {
        message: string, data: Policy
      }
    };
    return data.data;
  } catch (error) {
    console.error(`Error fetching policy with id ${id}:`, error);
    throw error;
  }
}

export async function createPolicy(input: PolicyInput, authToken?: string): Promise<Policy> {
  try {
    const { data } = await apiServices.post("/policies", input, authHeader(authToken)) as {
      data: {
        message: string, data: Policy
      }
    };
    return data.data;
  } catch (error) {
    console.error("Error creating policy:", error);
    throw error;
  }
}

export async function updatePolicy(id: string, input: PolicyInput, authToken?: string): Promise<Policy> {
  try {
    const { data } = await apiServices.put(`/policies/${id}`, input, authHeader(authToken)) as {
      data: {
        message: string, data: Policy
      }
    };
    return data.data;
  } catch (error) {
    console.error(`Error updating policy with id ${id}:`, error);
    throw error;
  }
}

export async function deletePolicy(id: string, authToken?: string): Promise<void> {
  try {
    await apiServices.delete(`/policies/${id}`, authHeader(authToken));
  } catch (error) {
    console.error(`Error deleting policy with id ${id}:`, error);
    throw error;
  }
}
