import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, MoreVertical } from "lucide-react";
import { useDeadlineWarnings } from "../../../application/hooks/useDeadlineWarnings";
import { DeadlineChip } from "./DeadlineChip";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";
import type { DeadlineWarningProps, DeadlineCategory } from "./types";
import styles from "./styles.module.css";

/**
 * Main deadline warning banner component
 * Displays aggregated deadline counts with filtering capabilities
 */
export const DeadlineWarningBox: React.FC<DeadlineWarningProps> = ({
                                                                       entityType,
                                                                       onFilterChange,
                                                                       className = "",
                                                                   }) => {
    const { deadlineData, isLoading, isError, refetch, isSnoozed, snoozeUntil } =
        useDeadlineWarnings(entityType);

    const [selectedCategory, setSelectedCategory] =
        useState<DeadlineCategory>(null);

    // Handle chip click for filtering
    const handleChipClick = useCallback(
        (category: DeadlineCategory) => {
            const newCategory = selectedCategory === category ? null : category;
            setSelectedCategory(newCategory);
            onFilterChange?.(newCategory);
        },
        [selectedCategory, onFilterChange]
    );

    // Show loading state
    if (isLoading) {
        return <LoadingState />;
    }

    // Show error state
    if (isError) {
        return <ErrorState onRetry={refetch} />;
    }

    // Don't render if no data or no warnings
    if (!deadlineData || !deadlineData[entityType]) {
        return null;
    }

    const { overdue, dueSoon } = deadlineData[entityType];
    const hasOverdue = overdue > 0;
    const hasDueSoon = dueSoon > 0;

    // Don't render if no warnings
    if (!hasOverdue && !hasDueSoon) {
        return null;
    }

    // Show snoozed state (Step 3 will implement full functionality)
    if (isSnoozed && snoozeUntil) {
        return (
            <motion.div
                className={styles.snoozedState}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
            >
                <div className={styles.snoozedContent}>
                    <span className={styles.snoozedIcon}>🔕</span>
                    <div className={styles.snoozedText}>
                        <p className={styles.snoozedTitle}>Deadline alerts snoozed</p>
                        <p className={styles.snoozedTime}>
                            Resumes {snoozeUntil.toLocaleString()}
                        </p>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                className={`${styles.deadlineWarningBox} ${className}`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
            >
                <div className={styles.infoBox}>
                    <div className={styles.warningHeader}>
                        <div className={styles.warningTitle}>
                            <AlertCircle size={20} className={styles.titleIcon} />
                            <h3>Deadline Alerts</h3>
                        </div>
                        <button
                            className={styles.menuButton}
                            aria-label="Snooze options"
                            aria-haspopup="true"
                            // Snooze menu will be added in Step 3
                        >
                            <MoreVertical size={20} />
                        </button>
                    </div>

                    <div className={styles.warningContent}>
                        <div className={styles.chipContainer}>
                            {hasOverdue && (
                                <DeadlineChip
                                    type="overdue"
                                    count={overdue}
                                    onClick={() => handleChipClick("overdue")}
                                    className={
                                        selectedCategory === "overdue" ? styles.chipSelected : ""
                                    }
                                />
                            )}
                            {hasDueSoon && (
                                <DeadlineChip
                                    type="dueSoon"
                                    count={dueSoon}
                                    onClick={() => handleChipClick("dueSoon")}
                                    className={
                                        selectedCategory === "dueSoon" ? styles.chipSelected : ""
                                    }
                                />
                            )}
                        </div>

                        {selectedCategory && (
                            <motion.p
                                className={styles.filterHint}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                Showing{" "}
                                {selectedCategory === "overdue" ? "overdue" : "due soon"} tasks
                                only
                            </motion.p>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default DeadlineWarningBox;