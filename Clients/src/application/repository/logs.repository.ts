import { apiServices } from "../../infrastructure/api/networkServices";
import { RequestParams } from "../../domain/interfaces/i.requestParams";
import { BackendResponse } from "../../domain/types/ApiTypes";

/**
 * Log entry structure returned from the backend
 */
interface LogEntry {
  id: number;
  message: string;
  level: string;
  timestamp: string;
  [key: string]: unknown;
}

/**
 * Retrieves all logs from the server.
 *
 * @returns {Promise<BackendResponse<LogEntry[]>>} A promise that resolves to the logs data wrapped in backend response.
 * @throws Will throw an error if the request fails.
 */
export async function getAllLogs({ routeUrl }: RequestParams): Promise<BackendResponse<LogEntry[]>> {
  try {
    const response = await apiServices.get<BackendResponse<LogEntry[]>>(routeUrl);
    return response.data;
  } catch (error: unknown) {
    console.error("Error fetching logs:", error);
    throw error;
  }
}
