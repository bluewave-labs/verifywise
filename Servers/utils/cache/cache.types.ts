import {
  RiskAnalytics,
  ExecutiveSummary,
  TimeseriesDataPoint,
} from "../../advisor/functions";
import { IRisk } from "../../domain.layer/interfaces/I.risk";

/**
 * Cache metadata included with all cached data
 */
export interface CacheMeta {
  computedAt: Date;
  tenant: string;
  projectId?: number;
}

export interface CachedRisks {
  _meta: CacheMeta;
  data: IRisk[];
}

/**
 * Cached risk analytics data
 */
export interface CachedRiskAnalytics {
  _meta: CacheMeta;
  data: RiskAnalytics;
}

/**
 * Cached executive summary data
 */
export interface CachedExecutiveSummary {
  _meta: CacheMeta;
  data: ExecutiveSummary;
}

/**
 * Cached timeseries data
 */
export interface CachedTimeseries {
  _meta: CacheMeta & {
    parameter: string;
    timeframe: string;
  };
  data: TimeseriesDataPoint[];
}

/**
 * Cache key builders
 */
export const CacheKeys = {
  risks: (tenant: string, projectId?: number): string => {
    return projectId
      ? `risks:${tenant}:project:${projectId}`
      : `risks:${tenant}`;
  },

  /**
   * Build cache key for risk analytics
   * Format: analytics:{tenant} or analytics:{tenant}:project:{id}
   */
  analytics: (tenant: string, projectId?: number): string => {
    return projectId
      ? `analytics:${tenant}:project:${projectId}`
      : `analytics:${tenant}`;
  },

  /**
   * Build cache key for executive summary
   * Format: executive:{tenant} or executive:{tenant}:project:{id}
   */
  executive: (tenant: string, projectId?: number): string => {
    return projectId
      ? `executive:${tenant}:project:${projectId}`
      : `executive:${tenant}`;
  },

  /**
   * Build cache key for timeseries data
   * Format: timeseries:{tenant}:{parameter}:{timeframe}
   */
  timeseries: (
    tenant: string,
    parameter: string,
    timeframe: string,
  ): string => {
    return `timeseries:${tenant}:${parameter}:${timeframe}`;
  },

  /**
   * Build pattern for invalidating all caches for a tenant
   * Format: *:{tenant}:*
   */
  tenantPattern: (tenant: string): string => {
    return `*:${tenant}:*`;
  },

  /**
   * Build pattern for invalidating all caches for a specific project
   * Format: *:{tenant}:project:{id}*
   */
  projectPattern: (tenant: string, projectId: number): string => {
    return `*:${tenant}:project:${projectId}*`;
  },
};
