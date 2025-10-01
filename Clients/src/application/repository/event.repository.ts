import { apiServices } from "../../infrastructure/api/networkServices";
import { RequestParams } from "../../domain/interfaces/iRequestParams";

/**
 * Retrieves all events from the server.
 *
 * @returns {Promise<Event[]>} A promise that resolves to an array of events.
 * @throws Will throw an error if the request fails.
 */
export async function getAllEvents({
  routeUrl,
}: RequestParams): Promise<any> {
  try {
    const response = await apiServices.get(routeUrl);
    console.log(response);
    return response;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
}
