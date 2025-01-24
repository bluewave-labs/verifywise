/**
 * Custom hook to fetch and manage vendor risks data.
 *
 * @param {Object} params - The parameters object.
 * @param {number} [params.id] - The optional project ID to fetch specific vendor risks.
 * @returns {Object} - The hook returns an object containing:
 *   - `vendorRisks` {VendorRisk[]} - The list of vendor risks.
 *   - `loadingvendorRisks` {boolean} - The loading state of the vendor risks.
 *   - `error` {string | boolean} - The error state of the vendor risks request.
 *   - `vendorRisksSummary` {Object} - The summary of vendor risks categorized by risk levels.
 */
import { useEffect, useState } from "react";
import { getEntityById } from "../repository/entity.repository";
import { convertToCamelCaseRiskKey } from "../tools/stringUtil";

export interface VendorRisk {
    id: number;
    project_id: number;
    vendor_name: string;
    risk_name: string;
    owner: string;
    risk_level: string;
    review_date: string;
}


const useVendorRisks = ({ projectId }: { projectId?: string | null }) => {
    const [vendorRisks, setVendorRisks] = useState<VendorRisk[]>([]);
    const [loadingVendorRisks, setLoadingVendorRisks] = useState<boolean>(true);
    const [error, setError] = useState<string | boolean>(false);

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const updateVendorRisks = async () => {
            setLoadingVendorRisks(true);
            try {
                const response = await getEntityById({
                    routeUrl: '/vendorRisks',
                    signal,
                })
                if (response.data) {
                    const filteredVendorRisks = projectId ? response.data.filter((risk: VendorRisk) => risk.project_id === Number(projectId)) : response.data
                    setVendorRisks(filteredVendorRisks)
                }
            } catch (err) {
                if (err instanceof Error) {
                    setError(`Request failed: ${err.message}`)
                } else {
                    setError(`Request failed`)
                }
            } finally {
                setLoadingVendorRisks(false)
            }
        }

        updateVendorRisks();

        return () => {
            controller.abort();
        };
    }, [projectId])


    const vendorRisksSummary = vendorRisks.reduce((acc, risk) => {
        const _risk = convertToCamelCaseRiskKey(risk.risk_level);
        const key = `${_risk.replace(/risks?$/i, '')}Risks` as keyof typeof acc;
        acc[key] = acc[key] + 1;

        return acc;
    }, {
        veryHighRisks: 0,
        highRisks: 0,
        mediumRisks: 0,
        lowRisks: 0,
        veryLowRisks: 0,
    });

    return {
        loadingVendorRisks,
        error,
        vendorRisks,
        vendorRisksSummary
    };
}

export default useVendorRisks;