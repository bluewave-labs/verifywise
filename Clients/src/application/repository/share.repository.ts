import { apiServices, ApiResponse } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";

export interface CreateShareLinkParams {
  resource_type: string;
  resource_id: number;
  settings?: {
    shareAllFields: boolean;
    allowDataExport: boolean;
    allowViewersToOpenRecords: boolean;
    displayToolbar: boolean;
  };
  expires_at?: Date;
}

export interface UpdateShareLinkParams {
  settings?: {
    shareAllFields: boolean;
    allowDataExport: boolean;
    allowViewersToOpenRecords: boolean;
    displayToolbar: boolean;
  };
  is_enabled?: boolean;
  expires_at?: Date;
}

/**
 * Share link structure
 */
interface ShareLink {
  id: number;
  token: string;
  resource_type: string;
  resource_id: number;
  settings?: {
    shareAllFields: boolean;
    allowDataExport: boolean;
    allowViewersToOpenRecords: boolean;
    displayToolbar: boolean;
  };
  is_enabled: boolean;
  expires_at?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Creates a new share link
 * POST /api/shares
 *
 * @param {CreateShareLinkParams} body - The share link data
 * @returns {Promise<ApiResponse<BackendResponse<ShareLink>>>} A promise that resolves to the created share link
 * @throws Will throw an error if the creation fails
 */
export async function createShareLink(body: CreateShareLinkParams): Promise<ApiResponse<BackendResponse<ShareLink>>> {
  const response = await apiServices.post<BackendResponse<ShareLink>>("/shares", body);
  return response;
}

/**
 * Get all share links for a specific resource
 * GET /api/shares/:resourceType/:resourceId
 *
 * @param {string} resourceType - Type of resource (e.g., 'model', 'policy')
 * @param {number} resourceId - ID of the resource
 * @returns {Promise<ApiResponse<BackendResponse<ShareLink[]>>>} A promise that resolves to the list of share links
 * @throws Will throw an error if the request fails
 */
export async function getShareLinksForResource(
  resourceType: string,
  resourceId: number
): Promise<ApiResponse<BackendResponse<ShareLink[]>>> {
  const response = await apiServices.get<BackendResponse<ShareLink[]>>(`/shares/${resourceType}/${resourceId}`);
  return response;
}

/**
 * Get a share link by token (public endpoint)
 * GET /api/shares/token/:token
 *
 * @param {string} token - The share token
 * @returns {Promise<ApiResponse<BackendResponse<ShareLink>>>} A promise that resolves to the share link data
 * @throws Will throw an error if the request fails
 */
export async function getShareLinkByToken(token: string): Promise<ApiResponse<BackendResponse<ShareLink>>> {
  const response = await apiServices.get<BackendResponse<ShareLink>>(`/shares/token/${token}`);
  return response;
}

/**
 * Update a share link
 * PATCH /api/shares/:id
 *
 * @param {number} id - The share link ID
 * @param {UpdateShareLinkParams} body - The update data
 * @returns {Promise<ApiResponse<BackendResponse<ShareLink>>>} A promise that resolves to the updated share link
 * @throws Will throw an error if the update fails
 */
export async function updateShareLink(
  id: number,
  body: UpdateShareLinkParams
): Promise<ApiResponse<BackendResponse<ShareLink>>> {
  const response = await apiServices.patch<BackendResponse<ShareLink>>(`/shares/${id}`, body);
  return response;
}

/**
 * Delete a share link
 * DELETE /api/shares/:id
 *
 * @param {number} id - The share link ID
 * @returns {Promise<ApiResponse<null>>} A promise that resolves to the deletion confirmation
 * @throws Will throw an error if the deletion fails
 */
export async function deleteShareLink(id: number): Promise<ApiResponse<null>> {
  const response = await apiServices.delete(`/shares/${id}`);
  return response;
}
