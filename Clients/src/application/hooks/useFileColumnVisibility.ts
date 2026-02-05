/**
 * @fileoverview File Column Visibility Hook
 *
 * React hook for managing file table column visibility with localStorage persistence.
 *
 * @module application/hooks/useFileColumnVisibility
 */

import { useState, useCallback, useEffect } from "react";

/**
 * Available columns for the file table
 */
export type FileColumn =
  | "filename"
  | "size"
  | "upload_date"
  | "uploader"
  | "tags"
  | "review_status"
  | "version"
  | "expiry_date"
  | "description"
  | "folders"
  | "source";

/**
 * Column configuration with display name and default visibility
 */
export interface ColumnConfig {
  key: FileColumn;
  label: string;
  defaultVisible: boolean;
  alwaysVisible?: boolean;
  width?: number | string;
}

/**
 * Default column configurations
 */
export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: "filename", label: "File name", defaultVisible: true, alwaysVisible: true },
  { key: "size", label: "Size", defaultVisible: true, width: 100 },
  { key: "upload_date", label: "Upload date", defaultVisible: true, width: 120 },
  { key: "uploader", label: "Uploaded by", defaultVisible: true, width: 150 },
  { key: "tags", label: "Tags", defaultVisible: false, width: 200 },
  { key: "review_status", label: "Status", defaultVisible: true, width: 120 },
  { key: "version", label: "Version", defaultVisible: false, width: 80 },
  { key: "expiry_date", label: "Expiry date", defaultVisible: false, width: 120 },
  { key: "description", label: "Description", defaultVisible: false, width: 200 },
  { key: "folders", label: "Folders", defaultVisible: true, width: 150 },
  { key: "source", label: "Source", defaultVisible: false, width: 150 },
];

const STORAGE_KEY = "verifywise:file-column-visibility";

interface UseFileColumnVisibilityReturn {
  // Current visibility state
  visibleColumns: Set<FileColumn>;
  columnConfigs: ColumnConfig[];

  // Actions
  toggleColumn: (column: FileColumn) => void;
  setColumnVisible: (column: FileColumn, visible: boolean) => void;
  resetToDefaults: () => void;
  isColumnVisible: (column: FileColumn) => boolean;

  // For column selector UI
  availableColumns: ColumnConfig[];
}

/**
 * Hook for managing file table column visibility
 *
 * Persists column visibility preferences to localStorage
 */
export function useFileColumnVisibility(): UseFileColumnVisibilityReturn {
  // Initialize from localStorage or defaults
  const [visibleColumns, setVisibleColumns] = useState<Set<FileColumn>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as FileColumn[];
        return new Set(parsed);
      }
    } catch (err) {
      console.error("Error loading column visibility from localStorage:", err);
    }

    // Return defaults
    return new Set(
      DEFAULT_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key)
    );
  });

  // Persist to localStorage when visibility changes
  useEffect(() => {
    try {
      const columnsArray = Array.from(visibleColumns);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columnsArray));
    } catch (err) {
      console.error("Error saving column visibility to localStorage:", err);
    }
  }, [visibleColumns]);

  /**
   * Toggle a column's visibility
   */
  const toggleColumn = useCallback((column: FileColumn) => {
    const config = DEFAULT_COLUMNS.find((c) => c.key === column);
    if (config?.alwaysVisible) return; // Can't hide always-visible columns

    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(column)) {
        next.delete(column);
      } else {
        next.add(column);
      }
      return next;
    });
  }, []);

  /**
   * Set a column's visibility explicitly
   */
  const setColumnVisible = useCallback((column: FileColumn, visible: boolean) => {
    const config = DEFAULT_COLUMNS.find((c) => c.key === column);
    if (config?.alwaysVisible && !visible) return; // Can't hide always-visible columns

    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (visible) {
        next.add(column);
      } else {
        next.delete(column);
      }
      return next;
    });
  }, []);

  /**
   * Reset to default visibility
   */
  const resetToDefaults = useCallback(() => {
    setVisibleColumns(
      new Set(DEFAULT_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key))
    );
  }, []);

  /**
   * Check if a column is visible
   */
  const isColumnVisible = useCallback(
    (column: FileColumn) => visibleColumns.has(column),
    [visibleColumns]
  );

  // Get column configs with current visibility
  const columnConfigs = DEFAULT_COLUMNS.map((config) => ({
    ...config,
    visible: visibleColumns.has(config.key),
  }));

  return {
    visibleColumns,
    columnConfigs,
    toggleColumn,
    setColumnVisible,
    resetToDefaults,
    isColumnVisible,
    availableColumns: DEFAULT_COLUMNS,
  };
}

export default useFileColumnVisibility;
