/**
 * Custom hook to fetch and manage vendor risks data.
 *
 * @param {Object} params - The parameters object.
 * @param {number} [params.id] - The optional project ID to fetch specific vendor risks.
 * @returns {Object} - The hook returns an object containing:
 *   - `vendorRisks` {VendorRisk[]} - The list of vendor risks.
 *   - `loadingVendorRisks` {boolean} - The loading state of the vendor risks.
 *   - `error` {string | boolean} - The error state of the vendor risks request.
 *   - `vendorRisksSummary` {Object} - The summary of vendor risks categorized by risk levels.
 *   - `refetchVendorRisks` {Function} - Function to manually refetch vendor risks data.
 */
import { useEffect, useState, useCallback } from "react";
import { getEntityById } from "../repository/entity.repository";
import { convertToCamelCaseRiskKey } from "../tools/stringUtil";
import { VendorRisk } from "../../domain/types/VendorRisk";

const useVendorRisks = ({ projectId }: { projectId?: string | null }) => {
  const [vendorRisks, setVendorRisks] = useState<VendorRisk[]>([]);
  const [loadingVendorRisks, setLoadingVendorRisks] = useState<boolean>(true);
  const [error, setError] = useState<string | boolean>(false);

  const fetchVendorRisks = useCallback(async () => {
    setLoadingVendorRisks(true);
    if (!projectId) {
      setLoadingVendorRisks(false);
      return;
    }

    try {
      const response = await getEntityById({
        routeUrl: `/vendorRisks/by-projid/${projectId}`,
      });
      if (response?.data) {
        setVendorRisks(response?.data);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(`Request failed: ${err.message}`);
      } else {
        setError(`Request failed`);
      }
    } finally {
      setLoadingVendorRisks(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchVendorRisks();
  }, [fetchVendorRisks]);

  const vendorRisksSummary = vendorRisks.reduce(
    (acc, risk) => {
      const _risk = convertToCamelCaseRiskKey(risk.risk_level);
      const key = `${_risk.replace(/risks?$/i, "")}Risks` as keyof typeof acc;
      acc[key] = acc[key] + 1;

      return acc;
    },
    {
      veryHighRisks: 0,
      highRisks: 0,
      mediumRisks: 0,
      lowRisks: 0,
      veryLowRisks: 0,
    }
  );

  return {
    loadingVendorRisks,
    error,
    vendorRisks,
    vendorRisksSummary,
    refetchVendorRisks: fetchVendorRisks,
  };
};

export default useVendorRisks;
