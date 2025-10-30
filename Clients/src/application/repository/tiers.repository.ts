import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/auth/getAuthToken";
import { Tier } from "../../domain/types/Tiers";

interface TierResponse {
  id: number;
  name: string;
  price: number;
  features: Tier;
}

/**
 * Retrieves features for a specific tier.
 *
 * @param {Object} params - The parameters for the request.
 * @param {number} params.tierId - The ID of the tier to get features for.
 * @param {string} params.routeUrl - The route URL for the API endpoint.
 * @param {string} [params.authToken] - The authentication token (defaults to current user's token).
 * @returns {Promise<unknown>} A promise that resolves to the tier features data.
 * @throws Will throw an error if the request fails.
 */
export async function getTierFeatures({
  tierId,
  routeUrl,
  authToken = getAuthToken(),
  responseType = "json",
} : {
    tierId: number,
    routeUrl: string,
    authToken?: string,
    responseType?: "json" | "blob"
}
): Promise<any> {
  const response = await apiServices.get(`${routeUrl}/features/${tierId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    responseType,
  });
  const data = response.data as { data?: TierResponse };
  return data.data ?? {};
}

export async function getAllTiers({
  signal,
  authToken = getAuthToken(),
}: {
  signal?: AbortSignal;
  authToken?: string;
} = {}): Promise<TierResponse[]> {
  const response = await apiServices.get("/tiers", {
    headers: { Authorization: `Bearer ${authToken}` },
    signal,
  });

  const data = response.data as { data?: TierResponse[] };
  return data.data ?? [];
}
