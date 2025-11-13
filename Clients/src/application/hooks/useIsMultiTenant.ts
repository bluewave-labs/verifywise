import { useEffect, useState } from "react";
import CustomAxios from "../../infrastructure/api/customAxios";

// Cache for organization exists check
let organizationCheckCache: {
  exists: boolean | null;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useIsMultiTenant = () => {
  const [isMultiTenant, setIsMultiTenant] = useState(false);

  useEffect(() => {
    const fetchOrganizationCount = async () => {
      // Check cache first
      const now = Date.now();
      if (
        organizationCheckCache &&
        organizationCheckCache.exists !== null &&
        now - organizationCheckCache.timestamp < CACHE_DURATION
      ) {
        // Use cached value
        if (
          !organizationCheckCache.exists || (
            window.location.host === "app.verifywise.ai" ||
            window.location.hostname === "test.verifywise.ai"
          )
        ) {
          setIsMultiTenant(true);
        }
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

        if (
          !exists || (
            window.location.host === "app.verifywise.ai" ||
            window.location.hostname === "test.verifywise.ai"
          )
        ) {
          setIsMultiTenant(true);
        }
      } catch (error) {
        console.error("Error checking organization existence:", error);
        // Default to multi-tenant on error for safety
        setIsMultiTenant(true);
      }
    };
    fetchOrganizationCount();
  }, []);

  return { isMultiTenant };
}
