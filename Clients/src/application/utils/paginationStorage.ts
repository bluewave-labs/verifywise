/**
 * Utility functions for managing pagination row count in localStorage
 */

const PAGINATION_STORAGE_KEY_PREFIX = 'pagination_rows_';

export const getPaginationRowCount = (tableKey: string, defaultCount: number = 10): number => {
  try {
    const stored = localStorage.getItem(`${PAGINATION_STORAGE_KEY_PREFIX}${tableKey}`);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Failed to retrieve pagination setting from localStorage:', error);
  }
  return defaultCount;
};

export const setPaginationRowCount = (tableKey: string, rowCount: number): void => {
  try {
    localStorage.setItem(`${PAGINATION_STORAGE_KEY_PREFIX}${tableKey}`, rowCount.toString());
  } catch (error) {
    console.warn('Failed to save pagination setting to localStorage:', error);
  }
};

export const clearPaginationRowCount = (tableKey: string): void => {
  try {
    localStorage.removeItem(`${PAGINATION_STORAGE_KEY_PREFIX}${tableKey}`);
  } catch (error) {
    console.warn('Failed to clear pagination setting from localStorage:', error);
  }
};

export const clearAllPaginationSettings = (): void => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(PAGINATION_STORAGE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Failed to clear all pagination settings from localStorage:', error);
  }
};