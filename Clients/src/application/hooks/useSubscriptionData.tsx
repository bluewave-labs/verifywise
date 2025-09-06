import { useEffect, useState, useCallback } from "react";
import { getTierFeatures } from "../repository/tiers.repository";
import { GetMyOrganization } from "../repository/organization.repository";
import { getSubscriptionById } from "../repository/subscription.repository";
import { extractUserToken } from "../tools/extractToken";
import { getAuthToken } from "../redux/auth/getAuthToken";
import { Tier } from "../../domain/types/Tiers";

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
  tierFeatures: Tier | null;
  organizationTierId: number | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Custom hook that fetches subscription-related data including tier features and organization subscription info
 * @returns Object containing tier features data, organization tier ID, loading state, and error state
 */
export const useSubscriptionData = (): UseSubscriptionDataReturn => {
  const [tierFeatures, setTierFeatures] = useState<Tier | null>(null);
  const [organizationTierId, setOrganizationTierId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState<number>(0);

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
  }, [organizationId, refetchTrigger]);

  // Fetch tier features data
  useEffect(() => {
    const fetchTierFeatures = async () => {
      if (!organizationTierId) return;
      
      try {
        setError(null);
        setLoading(true);
        const features = await getTierFeatures({
          tierId: organizationTierId,
          routeUrl: "/tiers"
        });
        setTierFeatures(features);
      } catch (err) {
        console.error("Failed to fetch tier features:", err);
        setError("Failed to load tier features");
      } finally {
        setLoading(false);
      }
    };

    fetchTierFeatures();
  }, [organizationTierId]);

  const refetch = useCallback(() => {
    setRefetchTrigger(prev => prev + 1);
  }, []);

  return {
    tierFeatures,
    organizationTierId,
    loading,
    error,
    refetch,
  };
};
