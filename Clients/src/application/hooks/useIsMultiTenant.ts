import { useEffect, useState } from "react";
import CustomAxios from "../../infrastructure/api/customAxios";

// Cache for organization exists check
let organizationCheckCache: {
  exists: boolean | null;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to determine if multi-tenant mode should be enabled
const shouldEnableMultiTenant = (organizationExists: boolean | null): boolean => {
  return !organizationExists || (
    window.location.hostname === "app.verifywise.ai" ||
    window.location.hostname === "test.verifywise.ai"
  );
};

export const useIsMultiTenant = () => {
  const [isMultiTenant, setIsMultiTenant] = useState(false);

  useEffect(() => {
    const fetchOrganizationCount = async () => {
      const now = Date.now();

      // Check cache first
      if (
        organizationCheckCache &&
        organizationCheckCache.exists !== null &&
        now - organizationCheckCache.timestamp < CACHE_DURATION
      ) {
        // Use cached value
        setIsMultiTenant(shouldEnableMultiTenant(organizationCheckCache.exists));
        return;
      }

      try {
        const response = await CustomAxios.get("/organizations/exists");
        const exists = response.data.data.exists;

        // Update cache
        organizationCheckCache = {
          exists,
          timestamp: now
        };

        setIsMultiTenant(shouldEnableMultiTenant(exists));
      } catch (error) {
        // Default to multi-tenant on error for safety
        // Error logging handled by server-side monitoring
        setIsMultiTenant(true);
      }
    };
    fetchOrganizationCount();
  }, []);

  return { isMultiTenant };
}
