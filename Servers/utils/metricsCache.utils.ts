import { Op } from "sequelize";
import { EvidentlyMetricsModel } from "../domain.layer/models/evidently/evidentlyMetrics.model";
import { EvidentlyModelModel } from "../domain.layer/models/evidently/evidentlyModel.model";
import logger from "./logger/fileLogger";
import type { MetricType, HealthStatus } from "../types/evidently.types";

/**
 * Cache configuration
 */
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached metrics from database
 * Returns cached data if less than 5 minutes old, otherwise null
 */
export async function getCachedMetrics(
  organizationId: number,
  projectId: string,
  metricType: MetricType
): Promise<any | null> {
  try {
    // Find the model record
    const model = await EvidentlyModelModel.findOne({
      where: {
        organization_id: organizationId,
        project_id: projectId,
      },
    });

    if (!model) {
      logger.debug(`No model found for project ${projectId}`);
      return null;
    }

    // Calculate cache expiry time
    const cacheExpiry = new Date(Date.now() - CACHE_TTL_MS);

    // Find recent cached metrics
    const cachedMetric = await EvidentlyMetricsModel.findOne({
      where: {
        model_id: model.id,
        metric_type: metricType,
        captured_at: {
          [Op.gte]: cacheExpiry,
        },
      },
      order: [["captured_at", "DESC"]],
    });

    if (cachedMetric) {
      logger.info(
        `Cache HIT for ${metricType} metrics, project ${projectId}, age: ${Math.round((Date.now() - cachedMetric.captured_at.getTime()) / 1000)}s`
      );
      return cachedMetric.metric_data;
    }

    logger.info(`Cache MISS for ${metricType} metrics, project ${projectId}`);
    return null;
  } catch (error) {
    logger.error(`Error getting cached metrics: ${error}`);
    return null; // On error, skip cache and fetch fresh data
  }
}

/**
 * Store metrics in cache
 */
export async function setCachedMetrics(
  organizationId: number,
  projectId: string,
  projectName: string,
  modelName: string,
  metricType: MetricType,
  metricData: any,
  status: HealthStatus
): Promise<void> {
  try {
    // Find or create model record
    let model = await EvidentlyModelModel.findOne({
      where: {
        organization_id: organizationId,
        project_id: projectId,
      },
    });

    if (!model) {
      // Create new model record
      model = await EvidentlyModelModel.create({
        organization_id: organizationId,
        project_id: projectId,
        project_name: projectName,
        model_name: modelName,
        drift_status: metricType === "drift" ? status : "unknown",
        performance_status: metricType === "performance" ? status : "unknown",
        fairness_status: metricType === "fairness" ? status : "unknown",
        metrics_count: 1,
        last_sync_at: new Date(),
      } as any);

      logger.info(`Created new model record for project ${projectId}`);
    } else {
      // Update existing model record
      const updates: any = {
        last_sync_at: new Date(),
        metrics_count: model.metrics_count + 1,
      };

      // Update status for this metric type
      if (metricType === "drift") {
        updates.drift_status = status;
      } else if (metricType === "performance") {
        updates.performance_status = status;
      } else if (metricType === "fairness") {
        updates.fairness_status = status;
      }

      await model.update(updates);
      logger.info(`Updated model record for project ${projectId}`);
    }

    // Store metrics in cache
    await EvidentlyMetricsModel.create({
      model_id: model.id,
      metric_type: metricType,
      metric_data: metricData,
      captured_at: new Date(),
    } as any);

    logger.info(
      `Cached ${metricType} metrics for project ${projectId}, model ${modelName}`
    );
  } catch (error) {
    logger.error(`Error caching metrics: ${error}`);
    // Don't throw - caching failure shouldn't break the API
  }
}

/**
 * Invalidate cached metrics for a project
 * Useful when data needs to be refreshed
 */
export async function invalidateCache(
  organizationId: number,
  projectId: string,
  metricType?: MetricType
): Promise<void> {
  try {
    const model = await EvidentlyModelModel.findOne({
      where: {
        organization_id: organizationId,
        project_id: projectId,
      },
    });

    if (!model) {
      return;
    }

    const where: any = { model_id: model.id };
    if (metricType) {
      where.metric_type = metricType;
    }

    const deleted = await EvidentlyMetricsModel.destroy({ where });

    logger.info(
      `Invalidated ${deleted} cached metrics for project ${projectId}${metricType ? ` (${metricType})` : ""}`
    );
  } catch (error) {
    logger.error(`Error invalidating cache: ${error}`);
  }
}

/**
 * Clean up old cached metrics (older than 7 days)
 * This should be called periodically (e.g., via a cron job)
 */
export async function cleanOldCache(): Promise<number> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const deleted = await EvidentlyMetricsModel.destroy({
      where: {
        captured_at: {
          [Op.lt]: sevenDaysAgo,
        },
      },
    });

    if (deleted > 0) {
      logger.info(`Cleaned up ${deleted} old cached metrics (>7 days)`);
    }

    return deleted;
  } catch (error) {
    logger.error(`Error cleaning old cache: ${error}`);
    return 0;
  }
}

/**
 * Get cache statistics for monitoring
 */
export async function getCacheStats(organizationId: number): Promise<{
  totalModels: number;
  totalCachedMetrics: number;
  metricsByType: Record<MetricType, number>;
  oldestCache: Date | null;
  newestCache: Date | null;
}> {
  try {
    const models = await EvidentlyModelModel.findAll({
      where: { organization_id: organizationId },
    });

    const modelIds = models.map((m) => m.id);

    const allMetrics = await EvidentlyMetricsModel.findAll({
      where: { model_id: { [Op.in]: modelIds } },
      order: [["captured_at", "DESC"]],
    });

    const metricsByType: Record<MetricType, number> = {
      drift: 0,
      performance: 0,
      fairness: 0,
    };

    allMetrics.forEach((m) => {
      if (m.metric_type in metricsByType) {
        metricsByType[m.metric_type as MetricType]++;
      }
    });

    return {
      totalModels: models.length,
      totalCachedMetrics: allMetrics.length,
      metricsByType,
      oldestCache: allMetrics.length > 0 ? allMetrics[allMetrics.length - 1].captured_at : null,
      newestCache: allMetrics.length > 0 ? allMetrics[0].captured_at : null,
    };
  } catch (error) {
    logger.error(`Error getting cache stats: ${error}`);
    return {
      totalModels: 0,
      totalCachedMetrics: 0,
      metricsByType: { drift: 0, performance: 0, fairness: 0 },
      oldestCache: null,
      newestCache: null,
    };
  }
}
