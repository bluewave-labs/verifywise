/**
 * @fileoverview Deadline Service API
 *
 * Provides API integration for the deadline warning system.
 * Handles fetching deadline analytics with proper error handling and caching.
 *
 * @module infrastructure/api/deadlineService
 */

import CustomAxios from "./customAxios";
import {
  DeadlineAnalyticsResponse,
  DeadlineAnalytics,
  DeadlineError,
} from "../../presentation/components/DeadlineWarningBox/types";

/**
 * API endpoints for deadline analytics
 */
const DEADLINE_ENDPOINTS = {
  SUMMARY: "/api/deadline-analytics/summary",
  DETAILS: "/api/deadline-analytics/details",
  CONFIG: "/api/deadline-analytics/config",
} as const;

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  TTL: 30000, // 30 seconds
  KEY_PREFIX: "deadline_analytics_",
} as const;

/**
 * In-memory cache for deadline analytics
 */
interface CacheEntry {
  data: DeadlineAnalytics;
  timestamp: number;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * Custom error class for deadline API errors
 */
export class DeadlineApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = "DeadlineApiError";
  }
}

/**
 * Clean expired cache entries
 */
function cleanExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) {
      cache.delete(key);
    }
  }
}

/**
 * Get cached data if available and not expired
 */
function getCachedData(cacheKey: string): DeadlineAnalytics | null {
  cleanExpiredCache();
  const entry = cache.get(cacheKey);

  if (entry && Date.now() < entry.expiresAt) {
    return entry.data;
  }

  if (entry) {
    cache.delete(cacheKey);
  }

  return null;
}

/**
 * Cache deadline analytics data
 */
function setCachedData(
  cacheKey: string,
  data: DeadlineAnalytics
): void {
  const now = Date.now();
  cache.set(cacheKey, {
    data,
    timestamp: now,
    expiresAt: now + CACHE_CONFIG.TTL,
  });
}

/**
 * Generate cache key for request
 */
function getCacheKey(endpoint: string, params?: Record<string, any>): string {
  const paramsStr = params ? JSON.stringify(params) : "";
  return `${CACHE_CONFIG.KEY_PREFIX}${endpoint}_${paramsStr}`;
}

/**
 * Fetch deadline analytics summary
 *
 * @param options - Request options
 * @returns Promise resolving to deadline analytics
 * @throws DeadlineApiError on API failure
 */
export async function fetchDeadlineAnalytics(
  options: {
    useCache?: boolean;
    signal?: AbortSignal;
    params?: Record<string, any>;
  } = {}
): Promise<DeadlineAnalytics> {
  const { useCache = true, signal, params = {} } = options;
  const cacheKey = getCacheKey(DEADLINE_ENDPOINTS.SUMMARY, params);

  // Return cached data if available
  if (useCache) {
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }

  try {
    const response = await CustomAxios.get<DeadlineAnalyticsResponse>(
      DEADLINE_ENDPOINTS.SUMMARY,
      {
        params,
        signal,
        timeout: 10000, // 10 second timeout
      }
    );

    const analytics = response.data.data;

    // Cache the successful response
    if (useCache && analytics) {
      setCachedData(cacheKey, analytics);
    }

    return analytics;
  } catch (error: any) {
    // Handle different types of errors
    if (error.name === "CanceledError") {
      throw new DeadlineApiError("Request was cancelled", 0, "CANCELLED");
    }

    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      const message = data?.message || "Failed to fetch deadline analytics";
      throw new DeadlineApiError(message, status, data?.code);
    } else if (error.request) {
      // Network error
      throw new DeadlineApiError(
        "Network error - please check your connection",
        0,
        "NETWORK_ERROR"
      );
    } else {
      // Other error (configuration, etc.)
      throw new DeadlineApiError(
        error.message || "An unexpected error occurred",
        0,
        "UNKNOWN_ERROR"
      );
    }
  }
}

/**
 * Fetch detailed deadline items for a specific category
 *
 * @param severity - Deadline severity (overdue or dueSoon)
 * @param entityType - Entity type (tasks, vendors, etc.)
 * @param options - Request options
 * @returns Promise resolving to detailed deadline items
 */
export async function fetchDeadlineDetails(
  severity: "overdue" | "dueSoon",
  entityType: string,
  options: {
    limit?: number;
    offset?: number;
    signal?: AbortSignal;
  } = {}
): Promise<any[]> {
  const { limit = 50, offset = 0, signal } = options;

  try {
    const response = await CustomAxios.get(
      DEADLINE_ENDPOINTS.DETAILS,
      {
        params: {
          severity,
          entityType,
          limit,
          offset,
        },
        signal,
        timeout: 15000, // 15 second timeout for potentially larger data
      }
    );

    return response.data.data || [];
  } catch (error: any) {
    if (error.name === "CanceledError") {
      throw new DeadlineApiError("Request was cancelled", 0, "CANCELLED");
    }

    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || "Failed to fetch deadline details";
      throw new DeadlineApiError(message, status, data?.code);
    } else if (error.request) {
      throw new DeadlineApiError(
        "Network error - please check your connection",
        0,
        "NETWORK_ERROR"
      );
    } else {
      throw new DeadlineApiError(
        error.message || "An unexpected error occurred",
        0,
        "UNKNOWN_ERROR"
      );
    }
  }
}

/**
 * Fetch deadline system configuration
 *
 * @param options - Request options
 * @returns Promise resolving to deadline configuration
 */
export async function fetchDeadlineConfig(
  options: {
    signal?: AbortSignal;
  } = {}
): Promise<any> {
  const { signal } = options;

  try {
    const response = await CustomAxios.get(
      DEADLINE_ENDPOINTS.CONFIG,
      {
        signal,
        timeout: 5000, // 5 second timeout for config
      }
    );

    return response.data.data || {};
  } catch (error: any) {
    if (error.name === "CanceledError") {
      throw new DeadlineApiError("Request was cancelled", 0, "CANCELLED");
    }

    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || "Failed to fetch deadline configuration";
      throw new DeadlineApiError(message, status, data?.code);
    } else if (error.request) {
      throw new DeadlineApiError(
        "Network error - please check your connection",
        0,
        "NETWORK_ERROR"
      );
    } else {
      throw new DeadlineApiError(
        error.message || "An unexpected error occurred",
        0,
        "UNKNOWN_ERROR"
      );
    }
  }
}

/**
 * Clear deadline analytics cache
 *
 * @param pattern - Optional pattern to clear specific cache entries
 */
export function clearDeadlineCache(pattern?: string): void {
  if (pattern) {
    // Clear cache entries matching pattern
    for (const [key] of cache.entries()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    // Clear all deadline cache entries
    for (const [key] of cache.entries()) {
      if (key.startsWith(CACHE_CONFIG.KEY_PREFIX)) {
        cache.delete(key);
      }
    }
  }
}

/**
 * Get cache statistics for debugging
 *
 * @returns Cache statistics object
 */
export function getDeadlineCacheStats(): {
  size: number;
  entries: Array<{ key: string; timestamp: number; expiresAt: number }>;
} {
  const entries = Array.from(cache.entries()).map(([key, entry]) => ({
    key,
    timestamp: entry.timestamp,
    expiresAt: entry.expiresAt,
  }));

  return {
    size: cache.size,
    entries,
  };
}