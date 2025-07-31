// src/repositories/policyRepository.ts

import { apiServices } from '../../infrastructure/api/networkServices';
import { getAuthToken } from '../redux/getAuthToken';
import { Policy } from '../../presentation/pages/PolicyDashboard/PoliciesDashboard';

const BASE_URL = '/api/policies';

/**
 * Fetch all policies.
 */
export async function getAllPolicies(authToken = getAuthToken()): Promise<Policy[]> {
  try {
    const response = await apiServices.get(BASE_URL, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data as Policy[];
  } catch (error) {
    console.error('Error fetching policies:', error);
    throw error;
  }
}

/**
 * Fetch a policy by ID.
 */
export async function getPolicyById(id: string, authToken = getAuthToken()): Promise<Policy> {
  try {
    const response = await apiServices.get(`${BASE_URL}/${id}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data as Policy;
  } catch (error) {
    console.error(`Error fetching policy ${id}:`, error);
    throw error;
  }
}

/**
 * Create a new policy.
 */
export async function createPolicy(
  policyData: Partial<Policy>,
  authToken = getAuthToken()
): Promise<Policy> {
  try {
    const response = await apiServices.post(BASE_URL, policyData, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data as Policy;
  } catch (error) {
    console.error('Error creating policy:', error);
    throw error;
  }
}

/**
 * Update an existing policy.
 */
export async function updatePolicy(
  id: string,
  policyData: Partial<Policy>,
  authToken = getAuthToken()
): Promise<Policy> {
  try {
    const response = await apiServices.put(`${BASE_URL}/${id}`, policyData, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data as Policy;
  } catch (error) {
    console.error(`Error updating policy ${id}:`, error);
    throw error;
  }
}

/**
 * Get all available policy tags.
 */
export async function getPolicyTags(authToken = getAuthToken()): Promise<string[]> {
  try {
    const response = await apiServices.get(`${BASE_URL}/tags`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return (response.data as { tags: string[] }).tags;
  } catch (error) {
    console.error('Error fetching policy tags:', error);
    throw error;
  }
}
