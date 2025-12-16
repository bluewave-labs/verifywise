import React from "react";
import { motion } from "framer-motion";
import type { DeadlineChipProps } from "./types";
import styles from "./styles.module.css";

/**
 * Individual deadline badge component
 * Shows count with appropriate styling and icon
 */
export const DeadlineChip: React.FC<DeadlineChipProps> = ({
                                                              type,
                                                              count,
                                                              onClick,
                                                              className = "",
                                                          }) => {
    
    const chipConfig = {
        overdue: {
            icon: "🔴",
            label: "overdue",
            ariaLabel: `${count} overdue ${count === 1 ? "task" : "tasks"}`,
        },
        dueSoon: {
            icon: "🟡",
            label: "due within 14 days",
            ariaLabel: `${count} ${
                count === 1 ? "task" : "tasks"
            } due within 14 days`,
        },
    };

    const config = chipConfig[type];

    return (
        <motion.button
            className={`${styles.deadlineChip} ${styles[type]} ${className}`}
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            aria-label={config.ariaLabel}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClick?.();
                }
            }}
        >
      <span className={styles.chipIcon} aria-hidden="true">
        {config.icon}
      </span>
            <span className={styles.chipCount}>{count}</span>
            <span className={styles.chipLabel}>{config.label}</span>
        </motion.button>
    );
};