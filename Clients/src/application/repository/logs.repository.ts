import { apiServices } from "../../infrastructure/api/networkServices";
import { RequestParams } from "../../domain/interfaces/iRequestParams";
import { getAuthToken } from "../redux/getAuthToken";

/**
 * Retrieves all logs from the server.
 *
 * @returns {Promise<any>} A promise that resolves to the logs data.
 * @throws Will throw an error if the request fails.
 */
export async function getAllLogs({
  routeUrl,
  authToken = getAuthToken(),
}: RequestParams): Promise<any> {
  try {
    const response = await apiServices.get(routeUrl, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching logs:", error);
    throw error;
  }
}
