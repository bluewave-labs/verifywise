import { apiServices } from "../../infrastructure/api/networkServices";

interface PolicyLinkedObjectData {
  policy_id?: number;
  linked_object_type?: string;
  linked_object_id?: number;
  [key: string]: unknown;
}

interface PolicyLinkedObjectResponse {
  id: number;
  policy_id: number;
  linked_object_type: string;
  linked_object_id: number;
}

/**
 * Creates a new policy linked object entry in the database.
 *
 * @param {string} routeUrl - The API route URL.
 * @param {PolicyLinkedObjectData} data - The policy linked object data to be saved.
 * @returns {Promise<PolicyLinkedObjectResponse>} The response from the API.
 */
export async function createPolicyLinkedObjects(
  routeUrl: string,
  data: PolicyLinkedObjectData,
): Promise<PolicyLinkedObjectResponse> {
  try {
    const response = await apiServices.post<PolicyLinkedObjectResponse>(routeUrl, data);
    return response.data;
  } catch (error) {
    console.error("Error creating policy linked objects:", error);
    // Re-throw the error with proper structure to preserve validation details
    throw error;
  }
}

