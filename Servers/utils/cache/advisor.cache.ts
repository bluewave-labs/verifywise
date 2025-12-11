import * as RedisCache from "./redis.cache";
import {
  CacheKeys,
  CachedRiskAnalytics,
  CachedExecutiveSummary,
  CachedTimeseries,
  CachedRisks,
} from "./cache.types";
import {
  RiskAnalytics,
  ExecutiveSummary,
  TimeseriesDataPoint,
} from "../../advisor/functions";
import { IRisk } from "../../domain.layer/interfaces/I.risk";

/**
 * Default TTL for advisor caches (15 minutes in seconds)
 */
const DEFAULT_TTL = 15 * 60; // 900 seconds

export async function getCachedRiskData(
  tenant: string,
  projectId?: number,
): Promise<IRisk[] | null> {
  const key = CacheKeys.risks(tenant, projectId);
  const cached = await RedisCache.get<CachedRisks>(key);

  if (cached) {
    return cached.data;
  }

  return null;
}

export async function setCachedRiskData(
  tenant: string,
  projectId: number | undefined,
  data: IRisk[],
  ttl: number = DEFAULT_TTL,
): Promise<boolean> {
  const key = CacheKeys.risks(tenant, projectId);
  const cached: CachedRisks = {
    _meta: {
      computedAt: new Date(),
      tenant,
      projectId,
    },
    data,
  };

  const success = await RedisCache.set(key, cached, ttl);
  return success;
}

/**
 * Get cached risk analytics or return null if not found
 *
 * @param tenant - Tenant identifier
 * @param projectId - Optional project ID
 * @returns Cached analytics data or null
 */
export async function getCachedAnalytics(
  tenant: string,
  projectId?: number,
): Promise<RiskAnalytics | null> {
  const key = CacheKeys.analytics(tenant, projectId);
  const cached = await RedisCache.get<CachedRiskAnalytics>(key);

  if (cached) {
    return cached.data;
  }

  return null;
}

/**
 * Cache risk analytics data
 *
 * @param tenant - Tenant identifier
 * @param projectId - Optional project ID
 * @param data - Analytics data to cache
 * @param ttl - Time to live in seconds (default: 15 minutes)
 * @returns True if cached successfully
 */
export async function setCachedAnalytics(
  tenant: string,
  projectId: number | undefined,
  data: RiskAnalytics,
  ttl: number = DEFAULT_TTL,
): Promise<boolean> {
  const key = CacheKeys.analytics(tenant, projectId);
  const cached: CachedRiskAnalytics = {
    _meta: {
      computedAt: new Date(),
      tenant,
      projectId,
    },
    data,
  };

  const success = await RedisCache.set(key, cached, ttl);
  return success;
}

/**
 * Get cached executive summary or return null if not found
 *
 * @param tenant - Tenant identifier
 * @param projectId - Optional project ID
 * @returns Cached executive summary or null
 */
export async function getCachedExecutiveSummary(
  tenant: string,
  projectId?: number,
): Promise<ExecutiveSummary | null> {
  const key = CacheKeys.executive(tenant, projectId);
  const cached = await RedisCache.get<CachedExecutiveSummary>(key);

  if (cached) {
    return cached.data;
  }

  return null;
}

/**
 * Cache executive summary data
 *
 * @param tenant - Tenant identifier
 * @param projectId - Optional project ID
 * @param data - Executive summary data to cache
 * @param ttl - Time to live in seconds (default: 15 minutes)
 * @returns True if cached successfully
 */
export async function setCachedExecutiveSummary(
  tenant: string,
  projectId: number | undefined,
  data: ExecutiveSummary,
  ttl: number = DEFAULT_TTL,
): Promise<boolean> {
  const key = CacheKeys.executive(tenant, projectId);
  const cached: CachedExecutiveSummary = {
    _meta: {
      computedAt: new Date(),
      tenant,
      projectId,
    },
    data,
  };

  const success = await RedisCache.set(key, cached, ttl);
  return success;
}

/**
 * Get cached timeseries data or return null if not found
 *
 * @param tenant - Tenant identifier
 * @param parameter - Timeseries parameter
 * @param timeframe - Timeframe string
 * @returns Cached timeseries data or null
 */
export async function getCachedTimeseries(
  tenant: string,
  parameter: string,
  timeframe: string,
): Promise<TimeseriesDataPoint[] | null> {
  const key = CacheKeys.timeseries(tenant, parameter, timeframe);
  const cached = await RedisCache.get<CachedTimeseries>(key);

  if (cached) {
    return cached.data;
  }

  return null;
}

/**
 * Cache timeseries data
 *
 * @param tenant - Tenant identifier
 * @param parameter - Timeseries parameter
 * @param timeframe - Timeframe string
 * @param data - Timeseries data to cache
 * @param ttl - Time to live in seconds (default: 15 minutes)
 * @returns True if cached successfully
 */
export async function setCachedTimeseries(
  tenant: string,
  parameter: string,
  timeframe: string,
  data: TimeseriesDataPoint[],
  ttl: number = DEFAULT_TTL,
): Promise<boolean> {
  const key = CacheKeys.timeseries(tenant, parameter, timeframe);
  const cached: CachedTimeseries = {
    _meta: {
      computedAt: new Date(),
      tenant,
      parameter,
      timeframe,
    },
    data,
  };

  const success = await RedisCache.set(key, cached, ttl);
  return success;
}

/**
 * Invalidate all risk-related caches for a tenant
 *
 * @param tenant - Tenant identifier
 * @param projectIds - Optional array of project IDs that were affected
 * @returns Number of cache keys deleted
 */
export async function invalidateRiskCache(
  tenant: string,
  projectIds?: number[],
): Promise<number> {
  let totalDeleted = 0;

  try {
    if (projectIds && projectIds.length > 0) {
      // Invalidate specific project caches
      for (const projectId of projectIds) {
        const pattern = CacheKeys.projectPattern(tenant, projectId);
        const deleted = await RedisCache.delPattern(pattern);
        totalDeleted += deleted;
      }
    }

    // Always invalidate tenant-level caches (they aggregate all projects)
    const tenantPattern = CacheKeys.tenantPattern(tenant);
    const deleted = await RedisCache.delPattern(tenantPattern);
    totalDeleted += deleted;

    return totalDeleted;
  } catch (error) {
    return totalDeleted;
  }
}

/**
 * Get cache health status
 *
 * @returns Cache availability and basic stats
 */
export async function getCacheHealth(): Promise<{
  available: boolean;
  stats?: any;
}> {
  const available = await RedisCache.isAvailable();
  if (available) {
    const stats = await RedisCache.getStats();
    return { available: true, stats };
  }
  return { available: false };
}
