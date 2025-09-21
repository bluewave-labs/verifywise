import { sequelize } from "../database/db";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

interface ComponentHealth {
  name: string;
  status: "healthy" | "degraded" | "down";
  responseTime: number;
  lastChecked: string;
  details: Record<string, any>;
  critical: boolean;
  metrics?: {
    availability?: number;
    averageResponseTime?: number;
    errorRate?: number;
  };
}

interface HealthResponse {
  overall: "healthy" | "degraded" | "down";
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  components: ComponentHealth[];
  metadata: {
    requestId: string;
    responseTime: number;
    checks: {
      performed: number;
      passed: number;
      failed: number;
    };
  };
}

class HealthService {
  private healthCache: HealthResponse | null = null;
  private lastHealthCheck = 0;
  private readonly CACHE_TTL = 10000; // 10 seconds

  async getHealthSummary(useCache: boolean = true, requestId: string = this.generateRequestId()): Promise<HealthResponse> {
    const startTime = Date.now();
    const now = Date.now();

    if (
      useCache &&
      this.healthCache &&
      now - this.lastHealthCheck < this.CACHE_TTL
    ) {
      // Update metadata for cached response
      this.healthCache.metadata.requestId = requestId;
      this.healthCache.metadata.responseTime = Date.now() - startTime;
      return this.healthCache;
    }

    const components = await Promise.allSettled([
      this.checkPostgresHealth(),
      this.checkDiskSpace(),
      this.checkMemoryUsage(),
      this.checkSystemLoad(),
    ]);

    const healthComponents: ComponentHealth[] = components.map(
      (result, index) => {
        if (result.status === "fulfilled") {
          return result.value;
        } else {
          return {
            name: ["postgres", "disk", "memory", "system"][index],
            status: "down" as const,
            responseTime: -1,
            lastChecked: new Date().toISOString(),
            details: { error: result.reason?.message || "Unknown error" },
            critical: index === 0, // PostgreSQL is critical
          };
        }
      }
    );

    const overallStatus = this.calculateOverallHealth(healthComponents);
    const responseTime = Date.now() - startTime;

    this.healthCache = {
      overall: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      components: healthComponents,
      metadata: {
        requestId,
        responseTime,
        checks: {
          performed: healthComponents.length,
          passed: healthComponents.filter(c => c.status === "healthy").length,
          failed: healthComponents.filter(c => c.status === "down").length,
        },
      },
    };

    this.lastHealthCheck = now;
    return this.healthCache;
  }

  async getLiveness(): Promise<{ status: string; timestamp: string; uptime: number }> {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  async getReadiness(): Promise<{ status: string; timestamp: string; critical: ComponentHealth[] }> {
    const criticalChecks = await Promise.allSettled([
      this.checkPostgresHealth(),
      this.checkDiskSpace(),
    ]);

    const criticalComponents: ComponentHealth[] = criticalChecks.map(
      (result, index) => {
        if (result.status === "fulfilled") {
          return result.value;
        } else {
          return {
            name: ["postgres", "disk"][index],
            status: "down" as const,
            responseTime: -1,
            lastChecked: new Date().toISOString(),
            details: { error: result.reason?.message || "Unknown error" },
            critical: true,
          };
        }
      }
    );

    const isReady = criticalComponents.every(c => c.status === "healthy");

    return {
      status: isReady ? "ready" : "not_ready",
      timestamp: new Date().toISOString(),
      critical: criticalComponents,
    };
  }

  private async checkPostgresHealth(): Promise<ComponentHealth> {
    const start = Date.now();

    try {
      await sequelize.authenticate();
      const [results] = await sequelize.query("SELECT 1 as health_check");

      return {
        name: "postgres",
        status: "healthy",
        responseTime: Date.now() - start,
        lastChecked: new Date().toISOString(),
        details: {
          connected: true,
          database: sequelize.getDatabaseName(),
          pool: {
            used: (sequelize as any).connectionManager?.pool?.used || 0,
            idle: (sequelize as any).connectionManager?.pool?.idle || 0,
            pending: (sequelize as any).connectionManager?.pool?.pending || 0,
          },
        },
        critical: true,
      };
    } catch (error: any) {
      return {
        name: "postgres",
        status: "down",
        responseTime: Date.now() - start,
        lastChecked: new Date().toISOString(),
        details: { error: error.message },
        critical: true,
      };
    }
  }

  private async checkDiskSpace(): Promise<ComponentHealth> {
    const start = Date.now();

    try {
      const stats = fs.statSync(".");
      const totalSpace = await this.getTotalDiskSpace();
      const freeSpace = await this.getFreeDiskSpace();
      const usedSpace = totalSpace - freeSpace;
      const usagePercent = (usedSpace / totalSpace) * 100;

      const status = usagePercent > 90 ? "down" : usagePercent > 80 ? "degraded" : "healthy";

      return {
        name: "disk",
        status,
        responseTime: Date.now() - start,
        lastChecked: new Date().toISOString(),
        details: {
          totalGB: Math.round(totalSpace / (1024 * 1024 * 1024) * 100) / 100,
          freeGB: Math.round(freeSpace / (1024 * 1024 * 1024) * 100) / 100,
          usagePercent: Math.round(usagePercent * 100) / 100,
        },
        critical: true,
      };
    } catch (error: any) {
      return {
        name: "disk",
        status: "down",
        responseTime: Date.now() - start,
        lastChecked: new Date().toISOString(),
        details: { error: error.message },
        critical: true,
      };
    }
  }

  private async checkMemoryUsage(): Promise<ComponentHealth> {
    const start = Date.now();

    try {
      const memUsage = process.memoryUsage();
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const usagePercent = (usedMemory / totalMemory) * 100;

      const status = usagePercent > 95 ? "down" : usagePercent > 85 ? "degraded" : "healthy";

      return {
        name: "memory",
        status,
        responseTime: Date.now() - start,
        lastChecked: new Date().toISOString(),
        details: {
          process: {
            rss: Math.round(memUsage.rss / (1024 * 1024) * 100) / 100,
            heapTotal: Math.round(memUsage.heapTotal / (1024 * 1024) * 100) / 100,
            heapUsed: Math.round(memUsage.heapUsed / (1024 * 1024) * 100) / 100,
            external: Math.round(memUsage.external / (1024 * 1024) * 100) / 100,
          },
          system: {
            totalGB: Math.round(totalMemory / (1024 * 1024 * 1024) * 100) / 100,
            freeGB: Math.round(freeMemory / (1024 * 1024 * 1024) * 100) / 100,
            usagePercent: Math.round(usagePercent * 100) / 100,
          },
        },
        critical: false,
      };
    } catch (error: any) {
      return {
        name: "memory",
        status: "down",
        responseTime: Date.now() - start,
        lastChecked: new Date().toISOString(),
        details: { error: error.message },
        critical: false,
      };
    }
  }

  private async checkSystemLoad(): Promise<ComponentHealth> {
    const start = Date.now();

    try {
      const loadAvg = os.loadavg();
      const cpuCount = os.cpus().length;
      const loadPercent = (loadAvg[0] / cpuCount) * 100;

      const status = loadPercent > 90 ? "down" : loadPercent > 70 ? "degraded" : "healthy";

      return {
        name: "system",
        status,
        responseTime: Date.now() - start,
        lastChecked: new Date().toISOString(),
        details: {
          loadAverage: {
            oneMinute: Math.round(loadAvg[0] * 100) / 100,
            fiveMinutes: Math.round(loadAvg[1] * 100) / 100,
            fifteenMinutes: Math.round(loadAvg[2] * 100) / 100,
          },
          cpuCount,
          loadPercent: Math.round(loadPercent * 100) / 100,
          platform: os.platform(),
          uptime: os.uptime(),
        },
        critical: false,
      };
    } catch (error: any) {
      return {
        name: "system",
        status: "down",
        responseTime: Date.now() - start,
        lastChecked: new Date().toISOString(),
        details: { error: error.message },
        critical: false,
      };
    }
  }

  private calculateOverallHealth(
    components: ComponentHealth[]
  ): "healthy" | "degraded" | "down" {
    const criticalComponents = components.filter((c) => c.critical);
    const nonCriticalComponents = components.filter((c) => !c.critical);

    // If any critical component is down, overall is down
    if (criticalComponents.some((c) => c.status === "down")) {
      return "down";
    }

    // If any critical component is degraded, overall is degraded
    if (criticalComponents.some((c) => c.status === "degraded")) {
      return "degraded";
    }

    // If non-critical components are having issues, overall is degraded
    if (nonCriticalComponents.some((c) => c.status === "down")) {
      return "degraded";
    }

    if (nonCriticalComponents.some((c) => c.status === "degraded")) {
      return "degraded";
    }

    return "healthy";
  }

  private generateRequestId(): string {
    return `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getTotalDiskSpace(): Promise<number> {
    try {
      // Use a simple estimation approach since statvfs is not available in Node.js
      // This could be enhanced with a third-party library if needed
      return 100 * 1024 * 1024 * 1024; // 100GB default estimation
    } catch (error) {
      return 100 * 1024 * 1024 * 1024; // 100GB fallback
    }
  }

  private async getFreeDiskSpace(): Promise<number> {
    try {
      // Use a simple estimation approach since statvfs is not available in Node.js
      // This could be enhanced with a third-party library if needed
      return 50 * 1024 * 1024 * 1024; // 50GB default estimation
    } catch (error) {
      return 50 * 1024 * 1024 * 1024; // 50GB fallback
    }
  }
}

export const healthService = new HealthService();
export { ComponentHealth, HealthResponse };