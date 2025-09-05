import { useEffect, useState } from "react";
import { getAllTiers } from "../repository/tiers.repository";
import { GetMyOrganization } from "../repository/organization.repository";
import { getSubscriptionById } from "../repository/subscription.repository";
import { extractUserToken } from "../tools/extractToken";
import { getAuthToken } from "../redux/auth/getAuthToken";

type Tier = { id: number; name: string; price: number | null; features?: Record<string, string | number> };

interface SubscriptionData {
  id: number;
  organization_id: number;
  tier_id: number;
  stripe_sub_id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

interface SubscriptionResponse {
  data: SubscriptionData;
}

interface UseSubscriptionDataReturn {
  tiers: Tier[];
  organizationTierId: number | null;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook that fetches subscription-related data including tiers and organization subscription info
 * @returns Object containing tiers data, organization tier ID, loading state, and error state
 */
export const useSubscriptionData = (): UseSubscriptionDataReturn => {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [organizationTierId, setOrganizationTierId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const userToken = extractUserToken(getAuthToken());
  const organizationId = userToken?.organizationId;

  // Fetch organization subscription data
  useEffect(() => {
    const fetchOrganizationTierId = async () => {
      if (!organizationId) return;
      
      try {
        setError(null);
        setLoading(true);
        
        // Step 1: Get organization data to get subscription_id
        const organization = await GetMyOrganization({
          routeUrl: `/organizations/${organizationId}`,
        });
        const org = organization.data.data;
        const subscriptionId = org.subscription_id;
        
        if (subscriptionId) {
          // Step 2: Get subscription details using subscription_id to get tier_id
          const subscription = await getSubscriptionById({
            id: subscriptionId,
          }) as SubscriptionResponse | null;
          
          if (subscription && subscription.data) {
            // Step 3: Extract tier_id from subscription details
            setOrganizationTierId(subscription.data.tier_id || 1);
          } else {
            setOrganizationTierId(1); // Default fallback
          }
        } else {
          setOrganizationTierId(1); // Default fallback if no subscription
        }
      } catch (err) {
        console.error("Failed to fetch organization subscription data:", err);
        setError("Failed to load organization subscription data");
        setOrganizationTierId(1); // Default fallback
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationTierId();
  }, [organizationId]);

  // Fetch tiers data
  useEffect(() => {
    const fetchTiers = async () => {
      try {
        setError(null);
        const tiersObject = await getAllTiers();
        if (tiersObject) {
          const tiersArray = Object.values(tiersObject);
          const plans = (tiersArray[1] ?? []) as Tier[];
          setTiers(plans);
        }
      } catch (err) {
        console.error("Failed to fetch tiers:", err);
        setError("Failed to load subscription tiers");
      }
    };

    fetchTiers();
  }, []);

  return {
    tiers,
    organizationTierId,
    loading,
    error,
  };
};
