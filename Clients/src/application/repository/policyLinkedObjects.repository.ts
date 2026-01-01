import { apiServices } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";

/**
 * Policy linked object structure
 */
interface PolicyLinkedObject {
  id: number;
  policy_id: number;
  object_type: string;
  object_id: number;
  created_at?: string;
  [key: string]: unknown;
}

/**
 * Policy linked object input for create
 */
interface PolicyLinkedObjectInput {
  policy_id?: number;
  object_type?: string;
  object_id?: number;
  [key: string]: unknown;
}

/**
 * Creates a new policy linked object entry in the database.
 *
 * @param {string} routeUrl - The API route URL.
 * @param {PolicyLinkedObjectInput} data - The policy linked object data to be saved.
 * @returns {Promise<BackendResponse<PolicyLinkedObject>>} The response from the API.
 */
export async function createPolicyLinkedObjects(
  routeUrl: string,
  data: PolicyLinkedObjectInput,
): Promise<BackendResponse<PolicyLinkedObject>> {
  try {
    const response = await apiServices.post<BackendResponse<PolicyLinkedObject>>(routeUrl, data);
    return response.data;
  } catch (error: unknown) {
    console.error("Error creating policy linked objects:", error);
    // Re-throw the error with proper structure to preserve validation details
    throw error;
  }
}
