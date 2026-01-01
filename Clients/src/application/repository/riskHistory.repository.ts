import { apiServices, ApiResponse } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";

/**
 * Timeseries data point structure
 */
interface RiskTimeseriesDataPoint {
  timestamp: string;
  value: number;
  [key: string]: unknown;
}

/**
 * Risk timeseries response structure
 */
interface RiskTimeseriesResponse {
  parameter: string;
  data: RiskTimeseriesDataPoint[];
  [key: string]: unknown;
}

/**
 * Risk parameter counts structure
 */
interface RiskParameterCounts {
  parameter: string;
  counts: Record<string, number>;
  [key: string]: unknown;
}

/**
 * Risk history snapshot structure
 */
interface RiskHistorySnapshot {
  id: number;
  parameter: string;
  description?: string;
  created_at: string;
  [key: string]: unknown;
}

/**
 * Get timeseries data for a specific risk parameter
 *
 * @param {string} parameter - The parameter to track (e.g., 'severity', 'likelihood', 'mitigation_status', 'risk_level')
 * @param {string} [timeframe] - Optional timeframe: '7days', '15days', '1month', '3months', '6months', '1year'
 * @param {string} [startDate] - Optional custom start date (ISO format)
 * @param {string} [endDate] - Optional custom end date (ISO format)
 * @param {number} [intervalHours] - Optional interval in hours for data points (default: 24)
 * @returns {Promise<ApiResponse<BackendResponse<RiskTimeseriesResponse>>>} The timeseries data
 */
export async function getRiskTimeseries(
  parameter: string,
  timeframe?: string,
  startDate?: string,
  endDate?: string,
  intervalHours?: number
): Promise<ApiResponse<BackendResponse<RiskTimeseriesResponse>>> {
  try {
    const response = await apiServices.get<BackendResponse<RiskTimeseriesResponse>>("/riskHistory/timeseries", {
      parameter, startDate, endDate, intervalHours, timeframe
    });
    return response;
  } catch (error: unknown) {
    console.error("Error fetching risk timeseries:", error);
    throw error;
  }
}

/**
 * Get current parameter counts
 *
 * @param {string} parameter - The parameter to get counts for
 * @returns {Promise<BackendResponse<RiskParameterCounts>>} The current counts
 */
export async function getCurrentRiskParameterCounts(parameter: string): Promise<BackendResponse<RiskParameterCounts>> {
  try {
    const response = await apiServices.get<BackendResponse<RiskParameterCounts>>("/api/riskHistory/current-counts", {
      params: { parameter },
    });
    return response.data;
  } catch (error: unknown) {
    console.error("Error fetching current risk parameter counts:", error);
    throw error;
  }
}

/**
 * Manually create a risk history snapshot
 *
 * @param {string} parameter - The parameter to snapshot
 * @param {string} [description] - Optional description of the snapshot
 * @returns {Promise<BackendResponse<RiskHistorySnapshot>>} The created snapshot
 */
export async function createRiskHistorySnapshot(
  parameter: string,
  description?: string
): Promise<BackendResponse<RiskHistorySnapshot>> {
  try {
    const response = await apiServices.post<BackendResponse<RiskHistorySnapshot>>("/api/riskHistory/snapshot", {
      parameter,
      description,
    });
    return response.data;
  } catch (error: unknown) {
    console.error("Error creating risk history snapshot:", error);
    throw error;
  }
}
