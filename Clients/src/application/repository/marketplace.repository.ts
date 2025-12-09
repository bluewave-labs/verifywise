/**
 * @fileoverview Marketplace Repository
 *
 * Provides API functions for interacting with the VerifyWise Plugin Marketplace.
 * The marketplace is a JSON registry hosted on GitHub that lists available plugins
 * for download and installation.
 *
 * ## Features
 *
 * - **Caching**: Caches marketplace data in localStorage for 1 hour
 * - **Offline support**: Falls back to stale cache when network is unavailable
 * - **Timeout handling**: Prevents hanging requests with 30-second timeout
 * - **Error handling**: User-friendly error messages for common HTTP errors
 *
 * ## Data Flow
 *
 * 1. Check localStorage for cached data
 * 2. If cache is valid (< 1 hour), return cached data
 * 3. If cache is stale or missing, fetch from GitHub
 * 4. On success, update cache and return fresh data
 * 5. On failure, return stale cache if available, otherwise return error
 *
 * ## Registry Format
 *
 * The marketplace registry is a JSON file with the following structure:
 *
 * ```json
 * {
 *   "version": "1.0.0",
 *   "generated": "2024-01-01T00:00:00Z",
 *   "plugins": [
 *     {
 *       "id": "my-plugin",
 *       "name": "My Plugin",
 *       "description": "Does something useful",
 *       "version": "1.0.0",
 *       "author": { "name": "Developer", "url": "https://example.com" },
 *       "type": "feature",
 *       "tags": ["utility", "productivity"],
 *       "download": "https://github.com/.../releases/download/v1.0.0/my-plugin.zip",
 *       "checksum": "sha256:abc123...",
 *       "permissions": ["database:read"]
 *     }
 *   ]
 * }
 * ```
 *
 * @module repository/marketplace
 */

import { apiServices } from "../../infrastructure/api/networkServices";

const MARKETPLACE_REGISTRY_URL =
  "https://raw.githubusercontent.com/bluewave-labs/plugin-marketplace/main/registry.json";
const CACHE_KEY = "vw_marketplace_cache";
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour
const FETCH_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Fetch with timeout using AbortController
 * Prevents requests from hanging indefinitely
 */
async function fetchWithTimeout(
  url: string,
  timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out. Please check your connection and try again.");
    }
    // Check for network errors
    if (error instanceof TypeError) {
      throw new Error("Unable to connect. Please check your internet connection.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export interface MarketplacePlugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: {
    name: string;
    url?: string;
  };
  type: "framework" | "integration" | "feature" | "reporting";
  tags: string[];
  icon?: string;
  download: string;
  checksum: string;
  compatibility?: {
    minVersion?: string;
  };
  permissions: string[];
}

export interface MarketplaceRegistry {
  version: string;
  generated: string;
  plugins: MarketplacePlugin[];
}

interface CachedData {
  data: MarketplaceRegistry;
  timestamp: number;
}

/**
 * Get cached marketplace data from localStorage
 */
function getCachedData(): CachedData | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

/**
 * Save marketplace data to localStorage cache
 */
function setCachedData(data: MarketplaceRegistry): void {
  try {
    const cacheEntry: CachedData = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
  } catch {
    // Ignore storage errors (quota exceeded, etc.)
  }
}

/**
 * Check if cached data is still valid (less than 1 hour old)
 */
function isCacheValid(cached: CachedData): boolean {
  return Date.now() - cached.timestamp < CACHE_DURATION_MS;
}

/**
 * Calculate how long ago the cache was updated
 */
export function getCacheAge(): { hours: number; minutes: number } | null {
  const cached = getCachedData();
  if (!cached) return null;

  const ageMs = Date.now() - cached.timestamp;
  const hours = Math.floor(ageMs / (60 * 60 * 1000));
  const minutes = Math.floor((ageMs % (60 * 60 * 1000)) / (60 * 1000));

  return { hours, minutes };
}

/**
 * Format cache age as human-readable string
 */
export function formatCacheAge(): string | null {
  const age = getCacheAge();
  if (!age) return null;

  if (age.hours > 0) {
    return `${age.hours}h ago`;
  } else if (age.minutes > 0) {
    return `${age.minutes}m ago`;
  } else {
    return "Just now";
  }
}

export interface MarketplaceResponse {
  success: boolean;
  data?: MarketplaceRegistry;
  error?: string;
  fromCache?: boolean;
  cacheAge?: string | null;
}

/**
 * Fetch marketplace registry from GitHub
 * Uses cache if available and valid, falls back to cache on network error
 */
export async function getMarketplacePlugins(): Promise<MarketplaceResponse> {
  const cached = getCachedData();

  // If cache is valid, return it
  if (cached && isCacheValid(cached)) {
    return {
      success: true,
      data: cached.data,
      fromCache: true,
      cacheAge: formatCacheAge(),
    };
  }

  // Try to fetch fresh data
  try {
    const response = await fetchWithTimeout(MARKETPLACE_REGISTRY_URL);

    if (!response.ok) {
      // Provide user-friendly error messages for common HTTP errors
      if (response.status === 404) {
        throw new Error("The plugin marketplace is not available yet. Check back later.");
      } else if (response.status === 403) {
        throw new Error("Access to the marketplace is restricted. Please try again later.");
      } else if (response.status >= 500) {
        throw new Error("The marketplace server is temporarily unavailable. Please try again later.");
      }
      throw new Error(`Unable to load marketplace (error ${response.status})`);
    }

    let data: MarketplaceRegistry;
    try {
      data = await response.json();
    } catch {
      throw new Error("Invalid response format from marketplace");
    }

    // Validate the response structure
    if (!data.plugins || !Array.isArray(data.plugins)) {
      throw new Error("Invalid registry format");
    }

    // Cache the fresh data
    setCachedData(data);

    return {
      success: true,
      data,
      fromCache: false,
      cacheAge: null,
    };
  } catch (error) {
    // If fetch fails but we have stale cache, return it
    if (cached) {
      return {
        success: true,
        data: cached.data,
        fromCache: true,
        cacheAge: formatCacheAge(),
        error: "Using cached data - unable to fetch latest",
      };
    }

    // No cache available
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch marketplace",
    };
  }
}

/**
 * Force refresh the marketplace data (bypass cache)
 */
export async function refreshMarketplace(): Promise<MarketplaceResponse> {
  try {
    const response = await fetchWithTimeout(MARKETPLACE_REGISTRY_URL);

    if (!response.ok) {
      // Provide user-friendly error messages for common HTTP errors
      if (response.status === 404) {
        throw new Error("The plugin marketplace is not available yet. Check back later.");
      } else if (response.status === 403) {
        throw new Error("Access to the marketplace is restricted. Please try again later.");
      } else if (response.status >= 500) {
        throw new Error("The marketplace server is temporarily unavailable. Please try again later.");
      }
      throw new Error(`Unable to refresh marketplace (error ${response.status})`);
    }

    let data: MarketplaceRegistry;
    try {
      data = await response.json();
    } catch {
      throw new Error("Invalid response format from marketplace");
    }

    if (!data.plugins || !Array.isArray(data.plugins)) {
      throw new Error("Invalid registry format");
    }

    setCachedData(data);

    return {
      success: true,
      data,
      fromCache: false,
      cacheAge: null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to refresh marketplace",
    };
  }
}

/**
 * Clear the marketplace cache
 */
export function clearMarketplaceCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // Ignore errors
  }
}

export interface InstallFromMarketplaceResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    id: string;
    name: string;
    version: string;
  };
}

/**
 * Install a plugin from the marketplace
 * Sends the download URL to the backend which handles the actual download and installation
 */
export async function installFromMarketplace(
  plugin: MarketplacePlugin
): Promise<InstallFromMarketplaceResponse> {
  try {
    const response = await apiServices.post<InstallFromMarketplaceResponse>(
      "/plugins/install-from-url",
      {
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        downloadUrl: plugin.download,
        checksum: plugin.checksum,
      }
    );
    return response.data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to install plugin",
    };
  }
}
