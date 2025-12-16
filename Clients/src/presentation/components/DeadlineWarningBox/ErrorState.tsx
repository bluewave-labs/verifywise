import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import styles from "./styles.module.css";

interface ErrorStateProps {
    onRetry: () => void;
}

/**
 * Error state component for deadline warning box
 */
export const ErrorState: React.FC<ErrorStateProps> = ({ onRetry }) => {
    return (
        <div className={styles.errorState} role="alert" aria-live="assertive">
            <div className={styles.errorContent}>
                <AlertTriangle className={styles.errorIcon} size={20} />
                <div className={styles.errorText}>
                    <p className={styles.errorTitle}>Unable to load deadline alerts</p>
                    <p className={styles.errorMessage}>
                        There was a problem fetching your deadline information.
                    </p>
                </div>
                <button
                    onClick={onRetry}
                    className={styles.retryButton}
                    aria-label="Retry loading deadlines"
                >
                    <RefreshCw size={16} />
                    Retry
                </button>
            </div>
        </div>
    );
};