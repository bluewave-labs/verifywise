import React from "react";
import styles from "./styles.module.css";

/**
 * Skeleton loading state for deadline warning box
 */
export const LoadingState: React.FC = () => {
    return (
        <div className={styles.loadingState} aria-live="polite" aria-busy="true">
            <div className={styles.loadingSkeleton}>
                <div className={styles.skeletonHeader}>
                    <div className={styles.skeletonIcon} />
                    <div className={styles.skeletonTitle} />
                </div>
                <div className={styles.skeletonChips}>
                    <div className={styles.skeletonChip} />
                    <div className={styles.skeletonChip} />
                </div>
            </div>
        </div>
    );
};