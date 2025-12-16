/**
 * TypeScript interfaces for Deadline Warning System
 */

export interface DeadlineSummary {
    tasks?: {
        overdue: number;
        dueSoon: number;
        threshold: number;
    };
    vendors?: {
        overdue: number;
        dueSoon: number;
        threshold: number;
    };
    policies?: {
        overdue: number;
        dueSoon: number;
        threshold: number;
    };
    risks?: {
        overdue: number;
        dueSoon: number;
        threshold: number;
    };
}

export interface DeadlineWarningProps {
    entityType: "tasks" | "vendors" | "policies" | "risks";
    onFilterChange?: (category: "overdue" | "dueSoon" | null) => void;
    className?: string;
}

export interface DeadlineChipProps {
    type: "overdue" | "dueSoon";
    count: number;
    onClick?: () => void;
    className?: string;
}

export interface UseDeadlineWarningsResult {
    deadlineData: DeadlineSummary | undefined;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    refetch: () => void;
    isSnoozed: boolean;
    snoozeUntil: Date | null;
}

export type DeadlineCategory = "overdue" | "dueSoon" | null;