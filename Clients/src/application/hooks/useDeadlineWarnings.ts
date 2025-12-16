import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { deadlineAPI } from "../../infrastructure/api/deadlineService";
import type {
    DeadlineSummary,
    UseDeadlineWarningsResult,
} from "../../presentation/components/DeadlineWarningBox/types";

/**
 * Custom hook for managing deadline warnings
 * Handles data fetching, caching, and snooze state checking
 *
 * @param entityType - Type of entity to fetch deadlines for
 * @returns Deadline data and state management functions
 */
export const useDeadlineWarnings = (
    entityType: "tasks" | "vendors" | "policies" | "risks"
): UseDeadlineWarningsResult => {
    const { userId } = useAuth();
    const [isSnoozed, setIsSnoozed] = useState(false);
    const [snoozeUntil, setSnoozeUntil] = useState<Date | null>(null);

    // Fetch deadline data with React Query
    const {
        data: deadlineData,
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery<DeadlineSummary>({
        queryKey: ["deadlines", entityType, userId],
        queryFn: () => deadlineAPI.getSummary(entityType),
        enabled: !!userId && !isSnoozed, // Only fetch if user exists and not snoozed
        refetchInterval: 60000, // Refresh every minute
        staleTime: 30000, // Consider data fresh for 30 seconds
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });

    // Check snooze state on mount and periodically
    useEffect(() => {
        if (!userId) return;

        const checkSnoozeState = () => {
            try {
                const key = `verifywise_deadline_snooze_${userId}_${entityType}`;
                const stored = localStorage.getItem(key);

                if (!stored) {
                    setIsSnoozed(false);
                    setSnoozeUntil(null);
                    return;
                }

                const snoozeState = JSON.parse(stored);
                const until = new Date(snoozeState.snoozedUntil);

                if (until > new Date()) {
                    // Still snoozed
                    setIsSnoozed(true);
                    setSnoozeUntil(until);
                } else {
                    // Snooze expired - clean up
                    localStorage.removeItem(key);
                    setIsSnoozed(false);
                    setSnoozeUntil(null);
                }
            } catch (error) {
                console.error("Error checking snooze state:", error);
                setIsSnoozed(false);
                setSnoozeUntil(null);
            }
        };

        // Check immediately
        checkSnoozeState();

        // Check every 10 seconds
        const interval = setInterval(checkSnoozeState, 10000);

        return () => clearInterval(interval);
    }, [userId, entityType]);

    return {
        deadlineData,
        isLoading,
        isError,
        error: error as Error | null,
        refetch,
        isSnoozed,
        snoozeUntil,
    };
};