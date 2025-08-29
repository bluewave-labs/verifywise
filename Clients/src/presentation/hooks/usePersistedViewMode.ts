import { useState } from "react";
import { ViewMode } from "../vw-v2-components/ViewToggle";

/**
 * Custom hook for managing view mode with localStorage persistence
 * 
 * @param key - localStorage key for persistence
 * @param defaultValue - default view mode if not found in localStorage
 * @returns [viewMode, setViewMode] tuple
 */
export const usePersistedViewMode = (
  key: string,
  defaultValue: ViewMode = "card"
): [ViewMode, (mode: ViewMode) => void] => {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const savedValue = localStorage.getItem(key);
      if (savedValue && (savedValue === "card" || savedValue === "table")) {
        return savedValue as ViewMode;
      }
    } catch (error) {
      console.warn("Failed to read view mode from localStorage:", error);
    }
    return defaultValue;
  });

  const updateViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(key, mode);
    } catch (error) {
      console.warn("Failed to save view mode to localStorage:", error);
    }
  };

  return [viewMode, updateViewMode];
};