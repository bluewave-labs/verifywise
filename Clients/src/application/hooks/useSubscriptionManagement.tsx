import { useState, useCallback } from "react";
import { upsertSubscription } from "../repository/subscription.repository";
import { UpdateMyOrganization } from "../repository/organization.repository";
import { getAuthToken } from "../redux/auth/getAuthToken";
import { extractUserToken } from "../tools/extractToken";

interface UseSubscriptionManagementResult {
  isProcessing: boolean;
  error: string | null;
  success: boolean;
  processSubscription: (organizationId: number, tierId: number, sessionId: string) => Promise<boolean>;
  clearError: () => void;
  clearSuccess: () => void;
}

/**
 * Custom hook for managing subscription operations
 * Handles subscription creation/update logic with proper error handling and state management
 */
export const useSubscriptionManagement = (): UseSubscriptionManagementResult => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const processSubscription = useCallback(async (
    organizationId: number,
    tierId: number,
    sessionId: string
  ): Promise<boolean> => {
    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await upsertSubscription({
        organizationId,
        tierId,
        sessionId,
        authToken: getAuthToken(),
      });

      if (result && result.success) {
        // Update organization with the subscription ID
        try {
          const userToken = extractUserToken(getAuthToken());
          const organizationId = userToken?.organizationId;

          if (organizationId) {
            await UpdateMyOrganization({
              routeUrl: `/organizations/${organizationId}`,
              body: { subscription_id: (result.data as any).data.id },
              authToken: getAuthToken(),
            });
          }
        } catch (orgError) {
          console.error(
            "Failed to update organization subscription:",
            orgError
          );
          // Don't fail the entire operation if organization update fails
          // The subscription was created successfully
        }

        setSuccess(true);
        return true;
      } else {
        setError(result.error || "Failed to process subscription");
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Subscription processing failed:", err);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearSuccess = useCallback(() => {
    setSuccess(false);
  }, []);

  return {
    isProcessing,
    error,
    success,
    processSubscription,
    clearError,
    clearSuccess,
  };
};
