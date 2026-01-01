import { apiServices, ApiResponse } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";
import { RequestParams } from "../../domain/interfaces/i.requestParams";

/**
 * Event structure
 */
interface Event {
  id: number;
  title: string;
  description?: string;
  event_date?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Retrieves all events from the server.
 *
 * @returns {Promise<ApiResponse<BackendResponse<Event[]>>>} A promise that resolves to an array of events.
 * @throws Will throw an error if the request fails.
 */
export async function getAllEvents({ routeUrl }: RequestParams): Promise<ApiResponse<BackendResponse<Event[]>>> {
  try {
    const response = await apiServices.get<BackendResponse<Event[]>>(routeUrl);
    return response;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
}
