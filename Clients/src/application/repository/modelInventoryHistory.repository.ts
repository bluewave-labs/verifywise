import { apiServices } from "../../infrastructure/api/networkServices";
import { AxiosResponse } from "axios";

interface TimeseriesDataPoint {
  timestamp: string;
  counts: Record<string, number>;
}

interface TimeseriesResponse {
  data: TimeseriesDataPoint[];
  parameter: string;
  timeframe?: string;
}

interface ParameterCountsResponse {
  counts: Record<string, number>;
  parameter: string;
}

interface SnapshotResponse {
  id: number;
  parameter: string;
  description?: string;
  created_at: string;
}

/**
 * Get timeseries data for a specific parameter
 *
 * @param {string} parameter - The parameter to track (e.g., 'status', 'security_assessment')
 * @param {string} [timeframe] - Optional timeframe: '7days', '15days', '1month', '3months', '6months', '1year'
 * @param {string} [startDate] - Optional custom start date (ISO format)
 * @param {string} [endDate] - Optional custom end date (ISO format)
 * @param {number} [intervalHours] - Optional interval in hours for data points (default: 24)
 * @returns {Promise<AxiosResponse<TimeseriesResponse>>} The timeseries data
 */
export async function getModelInventoryTimeseries(
  parameter: string,
  timeframe?: string,
  startDate?: string,
  endDate?: string,
  intervalHours?: number
): Promise<AxiosResponse<TimeseriesResponse>> {
  try {
    const response = await apiServices.get<TimeseriesResponse>("/modelInventoryHistory/timeseries", {
      parameter, startDate, endDate, intervalHours, timeframe
    });
    return response;
  } catch (error) {
    console.error("Error fetching model inventory timeseries:", error);
    throw error;
  }
}

/**
 * Get current parameter counts
 *
 * @param {string} parameter - The parameter to get counts for
 * @returns {Promise<ParameterCountsResponse>} The current counts
 */
export async function getCurrentParameterCounts(parameter: string): Promise<ParameterCountsResponse> {
  try {
    const response = await apiServices.get<ParameterCountsResponse>("/api/modelInventoryHistory/current-counts", {
      params: { parameter },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching current parameter counts:", error);
    throw error;
  }
}

/**
 * Manually create a history snapshot
 *
 * @param {string} parameter - The parameter to snapshot
 * @param {string} [description] - Optional description of the snapshot
 * @returns {Promise<SnapshotResponse>} The created snapshot
 */
export async function createHistorySnapshot(
  parameter: string,
  description?: string
): Promise<SnapshotResponse> {
  try {
    const response = await apiServices.post<SnapshotResponse>("/api/modelInventoryHistory/snapshot", {
      parameter,
      description,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating history snapshot:", error);
    throw error;
  }
}
