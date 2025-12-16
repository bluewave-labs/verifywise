import CustomAxios from "./customAxios";

import type { DeadlineSummary } from "../../presentation/components/DeadlineWarningBox/types";

/**
 * API client for deadline endpoints
 */
export const deadlineAPI = {
    /**
     * Get aggregated deadline summary
     * @param entityType - Type of entity (tasks, vendors, etc.)
     */
    async getSummary(
        entityType: "tasks" | "vendors" | "policies" | "risks"
    ): Promise<DeadlineSummary> {
        const response = await CustomAxios.get("/deadline-analytics/summary", {
            params: { entityType },
        });
        return response.data.data;
    },

    /**
     * Get detailed deadline items
     * @param entityType - Type of entity
     * @param category - Optional filter (overdue, dueSoon)
     */
    async getDetails(
        entityType: string,
        category?: "overdue" | "dueSoon"
    ): Promise<any[]> {
        const response = await CustomAxios.get("/deadline-analytics/details", {
            params: { entityType, category },
        });
        return response.data.data;
    },
};