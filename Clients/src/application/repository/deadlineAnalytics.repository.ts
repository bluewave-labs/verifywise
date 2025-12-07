import { getAllEntities } from "./entity.repository";

/**
 * Fetches deadline summary data for the user
 *
 * @param params - Optional query parameters for the request
 * @returns Promise with deadline summary data containing overdue and due-soon counts
 */
export async function getDeadlineSummary(params?: {
  entityType?: string;
}): Promise<any> {
  try {
    const queryParams = params ? new URLSearchParams(params as any).toString() : '';
    const routeUrl = `/deadline-analytics/summary${queryParams ? `?${queryParams}` : ''}`;
    const response = await getAllEntities({ routeUrl });
    return response;
  } catch (error) {
    console.error("Error fetching deadline summary:", error);
    throw error;
  }
}

/**
 * Fetches detailed deadline items with optional filtering
 *
 * @param params - Query parameters for filtering and pagination
 * @returns Promise with detailed deadline items array
 */
export async function getDeadlineDetails(params?: {
  entityType?: string;
  category?: string;
  page?: number;
  limit?: number;
}): Promise<any> {
  try {
    const queryParams = params ? new URLSearchParams(params as any).toString() : '';
    const routeUrl = `/deadline-analytics/details${queryParams ? `?${queryParams}` : ''}`;
    const response = await getAllEntities({ routeUrl });
    return response;
  } catch (error) {
    console.error("Error fetching deadline details:", error);
    throw error;
  }
}

/**
 * Fetches deadline service configuration
 *
 * @returns Promise with configuration data including thresholds and settings
 */
export async function getDeadlineConfig(): Promise<any> {
  try {
    const routeUrl = "/deadline-analytics/config";
    const response = await getAllEntities({ routeUrl });
    return response;
  } catch (error) {
    console.error("Error fetching deadline configuration:", error);
    throw error;
  }
}