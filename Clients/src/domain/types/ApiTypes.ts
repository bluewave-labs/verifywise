/**
 * Standard backend response wrapper.
 * All API endpoints return { message: string, data: T }
 * via the STATUS_CODE utility in Servers/utils/statusCode.utils.ts
 */
export interface BackendResponse<T> {
  message: string;
  data: T;
}

// Re-export ApiResponse from networkServices for convenience
export type { ApiResponse } from "../../infrastructure/api/networkServices";
