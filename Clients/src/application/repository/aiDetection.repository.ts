/**
 * @fileoverview AI Detection Repository
 *
 * API client for AI Detection endpoints.
 *
 * @module repository/aiDetection
 */

import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/auth/getAuthToken";
import {
  Scan,
  ScanStatusResponse,
  ScanResponse,
  FindingsResponse,
  ScansResponse,
  StartScanRequest,
  GetScansParams,
  GetFindingsParams,
  SecurityFindingsResponse,
  GetSecurityFindingsParams,
  SecuritySummary,
  GovernanceStatus,
  GovernanceSummary,
  UpdateGovernanceStatusResponse,
  AIDetectionStats,
  DependencyGraphResponse,
  ComplianceMappingResponse,
} from "../../domain/ai-detection/types";

const BASE_URL = "/ai-detection";

// ============================================================================
// Scan Operations
// ============================================================================

/**
 * Start a new repository scan
 *
 * @param repositoryUrl - GitHub repository URL to scan
 * @param signal - Optional abort signal
 * @param authToken - Optional auth token
 * @returns Created scan
 */
export async function startScan(
  repositoryUrl: string,
  signal?: AbortSignal,
  authToken: string = getAuthToken()
): Promise<Scan> {
  const response = await apiServices.post<{ data: Scan }>(
    `${BASE_URL}/scans`,
    { repository_url: repositoryUrl } as StartScanRequest,
    {
      headers: { Authorization: `Bearer ${authToken}` },
      signal,
    }
  );
  return response.data.data;
}

/**
 * Get scan status for polling
 *
 * @param scanId - Scan ID
 * @param signal - Optional abort signal
 * @param authToken - Optional auth token
 * @returns Scan status
 */
export async function getScanStatus(
  scanId: number,
  signal?: AbortSignal,
  authToken: string = getAuthToken()
): Promise<ScanStatusResponse> {
  const response = await apiServices.get<{ data: ScanStatusResponse }>(
    `${BASE_URL}/scans/${scanId}/status`,
    {
      headers: { Authorization: `Bearer ${authToken}` },
      signal,
    }
  );
  return response.data.data;
}

/**
 * Get scan details with summary
 *
 * @param scanId - Scan ID
 * @param signal - Optional abort signal
 * @param authToken - Optional auth token
 * @returns Scan with summary
 */
export async function getScan(
  scanId: number,
  signal?: AbortSignal,
  authToken: string = getAuthToken()
): Promise<ScanResponse> {
  const response = await apiServices.get<{ data: ScanResponse }>(
    `${BASE_URL}/scans/${scanId}`,
    {
      headers: { Authorization: `Bearer ${authToken}` },
      signal,
    }
  );
  return response.data.data;
}

/**
 * Get findings for a scan
 *
 * @param scanId - Scan ID
 * @param params - Pagination and filter params
 * @param signal - Optional abort signal
 * @param authToken - Optional auth token
 * @returns Paginated findings
 */
export async function getScanFindings(
  scanId: number,
  params: GetFindingsParams = {},
  signal?: AbortSignal,
  authToken: string = getAuthToken()
): Promise<FindingsResponse> {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.confidence) queryParams.append("confidence", params.confidence);
  if (params.finding_type) queryParams.append("finding_type", params.finding_type);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/scans/${scanId}/findings${queryString ? `?${queryString}` : ""}`;

  const response = await apiServices.get<{ data: FindingsResponse }>(url, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return response.data.data;
}

/**
 * Get security findings for a scan
 *
 * @param scanId - Scan ID
 * @param params - Pagination and filter params
 * @param signal - Optional abort signal
 * @param authToken - Optional auth token
 * @returns Paginated security findings
 */
export async function getScanSecurityFindings(
  scanId: number,
  params: GetSecurityFindingsParams = {},
  signal?: AbortSignal,
  authToken: string = getAuthToken()
): Promise<SecurityFindingsResponse> {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.severity) queryParams.append("severity", params.severity);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/scans/${scanId}/security-findings${queryString ? `?${queryString}` : ""}`;

  const response = await apiServices.get<{ data: SecurityFindingsResponse }>(url, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return response.data.data;
}

/**
 * Get security summary for a scan
 *
 * @param scanId - Scan ID
 * @param signal - Optional abort signal
 * @param authToken - Optional auth token
 * @returns Security summary
 */
export async function getScanSecuritySummary(
  scanId: number,
  signal?: AbortSignal,
  authToken: string = getAuthToken()
): Promise<SecuritySummary> {
  const response = await apiServices.get<{ data: SecuritySummary }>(
    `${BASE_URL}/scans/${scanId}/security-summary`,
    {
      headers: { Authorization: `Bearer ${authToken}` },
      signal,
    }
  );
  return response.data.data;
}

/**
 * Get scan history list
 *
 * @param params - Pagination and filter params
 * @param signal - Optional abort signal
 * @param authToken - Optional auth token
 * @returns Paginated scans
 */
export async function getScans(
  params: GetScansParams = {},
  signal?: AbortSignal,
  authToken: string = getAuthToken()
): Promise<ScansResponse> {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.status) queryParams.append("status", params.status);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/scans${queryString ? `?${queryString}` : ""}`;

  const response = await apiServices.get<{ data: ScansResponse }>(url, {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });
  return response.data.data;
}

/**
 * Cancel an in-progress scan
 *
 * @param scanId - Scan ID
 * @param signal - Optional abort signal
 * @param authToken - Optional auth token
 * @returns Cancellation result
 */
export async function cancelScan(
  scanId: number,
  signal?: AbortSignal,
  authToken: string = getAuthToken()
): Promise<{ id: number; status: "cancelled"; message: string }> {
  const response = await apiServices.post<{
    data: { id: number; status: "cancelled"; message: string };
  }>(
    `${BASE_URL}/scans/${scanId}/cancel`,
    {},
    {
      headers: { Authorization: `Bearer ${authToken}` },
      signal,
    }
  );
  return response.data.data;
}

/**
 * Delete a completed/failed/cancelled scan
 *
 * @param scanId - Scan ID
 * @param signal - Optional abort signal
 * @param authToken - Optional auth token
 * @returns Deletion result
 */
export async function deleteScan(
  scanId: number,
  signal?: AbortSignal,
  authToken: string = getAuthToken()
): Promise<{ message: string }> {
  const response = await apiServices.delete<{ data: { message: string } }>(
    `${BASE_URL}/scans/${scanId}`,
    {
      headers: { Authorization: `Bearer ${authToken}` },
      signal,
    }
  );
  return response.data.data;
}

/**
 * Get the most recent active scan (pending, cloning, or scanning)
 * Uses a single API call with server-side filtering for efficiency.
 *
 * @param signal - Optional abort signal
 * @param authToken - Optional auth token
 * @returns Most recent active scan or null
 */
export async function getActiveScan(
  signal?: AbortSignal,
  authToken: string = getAuthToken()
): Promise<Scan | null> {
  // Use the dedicated active scan endpoint for efficiency (single API call)
  const url = `${BASE_URL}/scans/active`;

  try {
    const response = await apiServices.get<{ data: Scan | null }>(url, {
      headers: { Authorization: `Bearer ${authToken}` },
      signal,
    });
    return response.data.data;
  } catch {
    // If endpoint doesn't exist or fails, return null
    return null;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Poll scan status until complete
 *
 * @param scanId - Scan ID
 * @param onProgress - Progress callback
 * @param pollInterval - Poll interval in ms (default 1000)
 * @param signal - Optional abort signal
 * @returns Final scan status
 */
export async function pollScanStatus(
  scanId: number,
  onProgress?: (status: ScanStatusResponse) => void,
  pollInterval: number = 1000,
  signal?: AbortSignal
): Promise<ScanStatusResponse> {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      if (signal?.aborted) {
        reject(new Error("Polling aborted"));
        return;
      }

      try {
        const status = await getScanStatus(scanId, signal);
        onProgress?.(status);

        if (
          status.status === "completed" ||
          status.status === "failed" ||
          status.status === "cancelled"
        ) {
          resolve(status);
        } else {
          setTimeout(poll, pollInterval);
        }
      } catch (error) {
        reject(error);
      }
    };

    poll();
  });
}

// ============================================================================
// Governance Operations
// ============================================================================

/**
 * Update governance status for a finding
 *
 * @param scanId - Scan ID
 * @param findingId - Finding ID
 * @param governanceStatus - New status or null to clear
 * @param signal - Optional abort signal
 * @param authToken - Optional auth token
 * @returns Updated finding
 */
export async function updateFindingGovernanceStatus(
  scanId: number,
  findingId: number,
  governanceStatus: GovernanceStatus | null,
  signal?: AbortSignal,
  authToken: string = getAuthToken()
): Promise<UpdateGovernanceStatusResponse> {
  const response = await apiServices.patch<{ data: UpdateGovernanceStatusResponse }>(
    `${BASE_URL}/scans/${scanId}/findings/${findingId}/governance`,
    { governance_status: governanceStatus },
    {
      headers: { Authorization: `Bearer ${authToken}` },
      signal,
    }
  );
  return response.data.data;
}

/**
 * Get governance summary for a scan
 *
 * @param scanId - Scan ID
 * @param signal - Optional abort signal
 * @param authToken - Optional auth token
 * @returns Governance summary
 */
export async function getGovernanceSummary(
  scanId: number,
  signal?: AbortSignal,
  authToken: string = getAuthToken()
): Promise<GovernanceSummary> {
  const response = await apiServices.get<{ data: GovernanceSummary }>(
    `${BASE_URL}/scans/${scanId}/governance-summary`,
    {
      headers: { Authorization: `Bearer ${authToken}` },
      signal,
    }
  );
  return response.data.data;
}

// ============================================================================
// Statistics Operations
// ============================================================================

/**
 * Get overall AI Detection statistics
 *
 * @param signal - Optional abort signal
 * @param authToken - Optional auth token
 * @returns AI Detection statistics
 */
export async function getAIDetectionStats(
  signal?: AbortSignal,
  authToken: string = getAuthToken()
): Promise<AIDetectionStats> {
  const response = await apiServices.get<{ data: AIDetectionStats }>(
    `${BASE_URL}/stats`,
    {
      headers: { Authorization: `Bearer ${authToken}` },
      signal,
    }
  );
  return response.data.data;
}

// ============================================================================
// Export Operations
// ============================================================================

/**
 * Export scan results as AI Bill of Materials (AI-BOM)
 *
 * @param scanId - Scan ID
 * @param signal - Optional abort signal
 * @param authToken - Optional auth token
 * @returns AI-BOM JSON data
 */
export async function exportAIBOM(
  scanId: number,
  signal?: AbortSignal,
  authToken: string = getAuthToken()
): Promise<unknown> {
  const response = await apiServices.get<{ data: unknown }>(
    `${BASE_URL}/scans/${scanId}/export/ai-bom`,
    {
      headers: { Authorization: `Bearer ${authToken}` },
      signal,
    }
  );
  return response.data.data;
}

// ============================================================================
// Dependency Graph Operations
// ============================================================================

/**
 * Get dependency graph data for visualization
 *
 * @param scanId - Scan ID
 * @param signal - Optional abort signal
 * @param authToken - Optional auth token
 * @returns Dependency graph nodes, edges, and metadata
 */
export async function getDependencyGraph(
  scanId: number,
  signal?: AbortSignal,
  authToken: string = getAuthToken()
): Promise<DependencyGraphResponse> {
  const response = await apiServices.get<{ data: DependencyGraphResponse }>(
    `${BASE_URL}/scans/${scanId}/dependency-graph`,
    {
      headers: { Authorization: `Bearer ${authToken}` },
      signal,
    }
  );
  return response.data.data;
}

// ============================================================================
// Compliance Operations
// ============================================================================

/**
 * Get EU AI Act compliance mapping for a scan
 *
 * @param scanId - Scan ID
 * @param signal - Optional abort signal
 * @param authToken - Optional auth token
 * @returns Compliance mapping with findings, checklist, and summary
 */
export async function getComplianceMapping(
  scanId: number,
  signal?: AbortSignal,
  authToken: string = getAuthToken()
): Promise<ComplianceMappingResponse> {
  const response = await apiServices.get<{ data: ComplianceMappingResponse }>(
    `${BASE_URL}/scans/${scanId}/compliance`,
    {
      headers: { Authorization: `Bearer ${authToken}` },
      signal,
    }
  );
  return response.data.data;
}
