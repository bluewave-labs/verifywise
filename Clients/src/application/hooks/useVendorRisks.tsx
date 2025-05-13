/**
 * Custom hook to fetch and manage vendor risks data.
 *
 * @param {Object} params - The parameters object.
 * @param {string} [params.projectId] - The optional project ID to filter vendor risks.
 * @param {string} [params.vendorId] - The optional vendor ID to filter vendor risks.
 * @returns {Object} - The hook returns an object containing:
 *   - `vendorRisks` {VendorRisk[]} - The list of vendor risks.
 *   - `loadingVendorRisks` {boolean} - The loading state of the vendor risks.
 *   - `error` {string | boolean} - The error state of the vendor risks request.
 *   - `vendorRisksSummary` {Object} - The summary of vendor risks categorized by risk levels.
 *   - `refetchVendorRisks` {Function} - Function to manually refetch vendor risks data.
 */
import { useEffect, useState, useCallback, useMemo } from "react";
import { getEntityById } from "../repository/entity.repository";
import { convertToCamelCaseRiskKey } from "../tools/stringUtil";
import { VendorRisk } from "../../domain/types/VendorRisk";

const useVendorRisks = ({ projectId, vendorId }: { projectId?: string | null; vendorId?: string | null }) => {
  const [vendorRisks, setVendorRisks] = useState<VendorRisk[]>([]);
  const [loadingVendorRisks, setLoadingVendorRisks] = useState<boolean>(true);
  const [error, setError] = useState<string | boolean>(false);

  const fetchVendorRisks = useCallback(async () => {
    setLoadingVendorRisks(true);
    try {
      const response = await getEntityById({
        routeUrl: `/vendorRisks/all`,
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
  }, []);

  useEffect(() => {
    fetchVendorRisks();
  }, [fetchVendorRisks]);

  // Filter risks based on projectId and vendorId
  const filteredVendorRisks = useMemo(() => {
    return vendorRisks.filter(risk => {
      const matchesProject = !projectId || projectId === "all" || risk.project_id?.toString() === projectId;
      const matchesVendor = !vendorId || vendorId === "all" || risk.vendor_id?.toString() === vendorId;
      return matchesProject && matchesVendor;
    });
  }, [vendorRisks, projectId, vendorId]);

  const vendorRisksSummary = useMemo(() => {
    return filteredVendorRisks.reduce(
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
  }, [filteredVendorRisks]);

  return {
    loadingVendorRisks,
    error,
    vendorRisks: filteredVendorRisks,
    vendorRisksSummary,
    refetchVendorRisks: fetchVendorRisks,
  };
};

export default useVendorRisks;
