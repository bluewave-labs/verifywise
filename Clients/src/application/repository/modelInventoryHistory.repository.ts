import { apiServices, ApiResponse } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";

/**
 * Timeseries data point structure
 */
interface TimeseriesDataPoint {
  timestamp: string;
  value: number;
  [key: string]: unknown;
}

/**
 * Timeseries response structure
 */
interface TimeseriesResponse {
  parameter: string;
  data: TimeseriesDataPoint[];
  [key: string]: unknown;
}

/**
 * Parameter counts structure
 */
interface ParameterCounts {
  parameter: string;
  counts: Record<string, number>;
  [key: string]: unknown;
}

/**
 * History snapshot structure
 */
interface HistorySnapshot {
  id: number;
  parameter: string;
  description?: string;
  created_at: string;
  [key: string]: unknown;
}

/**
 * Get timeseries data for a specific parameter
 *
 * @param {string} parameter - The parameter to track (e.g., 'status', 'security_assessment')
 * @param {string} [timeframe] - Optional timeframe: '7days', '15days', '1month', '3months', '6months', '1year'
 * @param {string} [startDate] - Optional custom start date (ISO format)
 * @param {string} [endDate] - Optional custom end date (ISO format)
 * @param {number} [intervalHours] - Optional interval in hours for data points (default: 24)
 * @returns {Promise<ApiResponse<BackendResponse<TimeseriesResponse>>>} The timeseries data
 */
export async function getModelInventoryTimeseries(
  parameter: string,
  timeframe?: string,
  startDate?: string,
  endDate?: string,
  intervalHours?: number
): Promise<ApiResponse<BackendResponse<TimeseriesResponse>>> {
  try {
    const response = await apiServices.get<BackendResponse<TimeseriesResponse>>("/modelInventoryHistory/timeseries", {
      parameter, startDate, endDate, intervalHours, timeframe
    });
    return response;
  } catch (error: unknown) {
    console.error("Error fetching model inventory timeseries:", error);
    throw error;
  }
}

/**
 * Get current parameter counts
 *
 * @param {string} parameter - The parameter to get counts for
 * @returns {Promise<BackendResponse<ParameterCounts>>} The current counts
 */
export async function getCurrentParameterCounts(parameter: string): Promise<BackendResponse<ParameterCounts>> {
  try {
    const response = await apiServices.get<BackendResponse<ParameterCounts>>("/api/modelInventoryHistory/current-counts", {
      params: { parameter },
    });
    return response.data;
  } catch (error: unknown) {
    console.error("Error fetching current parameter counts:", error);
    throw error;
  }
}

/**
 * Manually create a history snapshot
 *
 * @param {string} parameter - The parameter to snapshot
 * @param {string} [description] - Optional description of the snapshot
 * @returns {Promise<BackendResponse<HistorySnapshot>>} The created snapshot
 */
export async function createHistorySnapshot(
  parameter: string,
  description?: string
): Promise<BackendResponse<HistorySnapshot>> {
  try {
    const response = await apiServices.post<BackendResponse<HistorySnapshot>>("/api/modelInventoryHistory/snapshot", {
      parameter,
      description,
    });
    return response.data;
  } catch (error: unknown) {
    console.error("Error creating history snapshot:", error);
    throw error;
  }
}
