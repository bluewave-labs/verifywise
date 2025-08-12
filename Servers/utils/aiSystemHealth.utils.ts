import { Op } from 'sequelize';
import { AISystemHealth } from '../domain.layer/models/aiSystemHealth/aiSystemHealth.model';
import { AIHealthAlert } from '../domain.layer/models/aiHealthAlert/aiHealthAlert.model';
import { AIHealthMetrics } from '../domain.layer/models/aiHealthMetrics/aiHealthMetrics.model';
import { logFailure } from './logger/logHelper';

/**
 * Calculate overall health score based on individual component scores
 */
export const calculateOverallScore = (
  performance: number,
  security: number,
  compliance: number,
  reliability: number,
  weights: { performance: number; security: number; compliance: number; reliability: number } = {
    performance: 0.3,
    security: 0.25,
    compliance: 0.25,
    reliability: 0.2
  }
): number => {
  const weightedScore = 
    (performance * weights.performance) +
    (security * weights.security) +
    (compliance * weights.compliance) +
    (reliability * weights.reliability);
  
  return Math.round(weightedScore);
};

/**
 * Determine health status based on overall score
 */
export const getHealthStatus = (score: number): 'excellent' | 'good' | 'fair' | 'poor' => {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 70) return 'fair';
  return 'poor';
};

/**
 * Generate health score based on recent metrics
 */
export const calculateHealthFromMetrics = async (systemHealthId: number): Promise<{
  performance: number;
  security: number;
  compliance: number;
  reliability: number;
}> => {
  try {
    // Get recent metrics (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const metrics = await AIHealthMetrics.findAll({
      where: {
        systemHealthId,
        recordedAt: {
          [Op.gte]: oneDayAgo
        }
      },
      order: [['recordedAt', 'DESC']]
    });

    if (metrics.length === 0) {
      // Return default scores if no metrics found
      return {
        performance: 85,
        security: 85,
        compliance: 85,
        reliability: 85
      };
    }

    // Calculate scores based on metric types
    const performanceMetrics = metrics.filter(m => 
      ['response_time', 'throughput', 'accuracy', 'prediction_confidence'].includes(m.metricType)
    );
    
    const securityMetrics = metrics.filter(m => 
      ['error_rate', 'network_latency'].includes(m.metricType)
    );
    
    const reliabilityMetrics = metrics.filter(m => 
      ['cpu_usage', 'memory_usage', 'disk_usage'].includes(m.metricType)
    );

    // Calculate average scores (simplified logic - in production, you'd have more sophisticated algorithms)
    const performance = performanceMetrics.length > 0 
      ? Math.round(performanceMetrics.reduce((sum, m) => sum + (m.isWithinThreshold ? 90 : 60), 0) / performanceMetrics.length)
      : 85;

    const security = securityMetrics.length > 0
      ? Math.round(securityMetrics.reduce((sum, m) => sum + (m.isWithinThreshold ? 95 : 70), 0) / securityMetrics.length)
      : 85;

    const reliability = reliabilityMetrics.length > 0
      ? Math.round(reliabilityMetrics.reduce((sum, m) => sum + (m.isWithinThreshold ? 90 : 65), 0) / reliabilityMetrics.length)
      : 85;

    // Compliance score based on overall system health (simplified)
    const compliance = Math.round((performance + security + reliability) / 3);

    return {
      performance,
      security,
      compliance,
      reliability
    };

  } catch (error) {
    logFailure({
      eventType: 'Read',
      description: `Error calculating health from metrics: ${error}`,
      functionName: 'calculateHealthFromMetrics',
      fileName: 'aiSystemHealth.utils.ts',
      error: error as Error
    });
    
    // Return default scores on error
    return {
      performance: 75,
      security: 75,
      compliance: 75,
      reliability: 75
    };
  }
};

/**
 * Auto-generate alerts based on health thresholds
 */
export const generateAutoAlerts = async (systemHealthId: number): Promise<void> => {
  try {
    const system = await AISystemHealth.findByPk(systemHealthId);
    if (!system) return;

    const alerts = [];

    // Check for low performance
    if (system.performanceScore < 70) {
      alerts.push({
        systemHealthId,
        alertType: 'warning' as const,
        title: 'Performance Degradation Detected',
        description: `System ${system.systemName} performance score has dropped to ${system.performanceScore}%`,
        severity: system.performanceScore < 50 ? 'high' as const : 'medium' as const,
        status: 'active' as const,
        organizationId: system.organizationId,
        projectId: system.projectId
      });
    }

    // Check for security issues
    if (system.securityScore < 75) {
      alerts.push({
        systemHealthId,
        alertType: system.securityScore < 60 ? 'error' as const : 'warning' as const,
        title: 'Security Score Below Threshold',
        description: `System ${system.systemName} security score is ${system.securityScore}%, below the recommended threshold`,
        severity: system.securityScore < 60 ? 'critical' as const : 'high' as const,
        status: 'active' as const,
        organizationId: system.organizationId,
        projectId: system.projectId
      });
    }

    // Check for compliance issues
    if (system.complianceScore < 80) {
      alerts.push({
        systemHealthId,
        alertType: 'warning' as const,
        title: 'Compliance Issue Detected',
        description: `System ${system.systemName} compliance score is ${system.complianceScore}%, requires attention`,
        severity: system.complianceScore < 65 ? 'high' as const : 'medium' as const,
        status: 'active' as const,
        organizationId: system.organizationId,
        projectId: system.projectId
      });
    }

    // Check for reliability issues
    if (system.reliabilityScore < 75) {
      alerts.push({
        systemHealthId,
        alertType: 'warning' as const,
        title: 'Reliability Concerns',
        description: `System ${system.systemName} reliability score has decreased to ${system.reliabilityScore}%`,
        severity: 'medium' as const,
        status: 'active' as const,
        organizationId: system.organizationId,
        projectId: system.projectId
      });
    }

    // Check uptime
    if (system.uptime < 99.0) {
      alerts.push({
        systemHealthId,
        alertType: system.uptime < 95.0 ? 'error' as const : 'warning' as const,
        title: 'System Uptime Below Expected',
        description: `System ${system.systemName} uptime is ${system.uptime.toFixed(2)}%`,
        severity: system.uptime < 95.0 ? 'critical' as const : 'medium' as const,
        status: 'active' as const,
        organizationId: system.organizationId,
        projectId: system.projectId
      });
    }

    // Create alerts that don't already exist
    for (const alertData of alerts) {
      const existingAlert = await AIHealthAlert.findOne({
        where: {
          systemHealthId: alertData.systemHealthId,
          title: alertData.title,
          status: 'active'
        }
      });

      if (!existingAlert) {
        await AIHealthAlert.create(alertData);
      }
    }

  } catch (error) {
    logFailure({
      eventType: 'Create',
      description: `Error generating auto alerts: ${error}`,
      functionName: 'generateAutoAlerts',
      fileName: 'aiSystemHealth.utils.ts',
      error: error as Error
    });
  }
};

/**
 * Clean up old metrics and alerts
 */
export const cleanupOldData = async (retentionDays: number = 30): Promise<void> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Clean up old metrics
    const deletedMetrics = await AIHealthMetrics.destroy({
      where: {
        recordedAt: {
          [Op.lt]: cutoffDate
        }
      }
    });

    // Clean up resolved alerts older than retention period
    const deletedAlerts = await AIHealthAlert.destroy({
      where: {
        status: 'resolved',
        resolvedAt: {
          [Op.lt]: cutoffDate
        }
      }
    });

    console.log(`Cleanup completed: ${deletedMetrics} metrics and ${deletedAlerts} alerts removed`);

  } catch (error) {
    logFailure({
      eventType: 'Delete',
      description: `Error during cleanup: ${error}`,
      functionName: 'cleanupOldData',
      fileName: 'aiSystemHealth.utils.ts',
      error: error as Error
    });
  }
};

/**
 * Generate risk assessment based on system health data
 */
export const generateRiskAssessment = (systems: AISystemHealth[]): {
  overallRisk: 'low' | 'medium' | 'high';
  riskFactors: string[];
  recommendations: string[];
} => {
  if (systems.length === 0) {
    return {
      overallRisk: 'low',
      riskFactors: [],
      recommendations: ['Add AI systems to monitor health and risks']
    };
  }

  const avgScore = systems.reduce((sum, sys) => sum + sys.overallScore, 0) / systems.length;
  const lowPerformingSystems = systems.filter(sys => sys.overallScore < 75).length;
  const criticalSystems = systems.filter(sys => sys.overallScore < 60).length;

  let overallRisk: 'low' | 'medium' | 'high' = 'low';
  const riskFactors: string[] = [];
  const recommendations: string[] = [];

  // Determine risk level
  if (avgScore < 70 || criticalSystems > 0) {
    overallRisk = 'high';
  } else if (avgScore < 80 || lowPerformingSystems > systems.length * 0.3) {
    overallRisk = 'medium';
  }

  // Identify risk factors
  if (criticalSystems > 0) {
    riskFactors.push(`${criticalSystems} system(s) in critical condition`);
    recommendations.push('Immediate attention required for critical systems');
  }

  if (lowPerformingSystems > 0) {
    riskFactors.push(`${lowPerformingSystems} system(s) underperforming`);
    recommendations.push('Review and optimize underperforming systems');
  }

  const lowSecuritySystems = systems.filter(sys => sys.securityScore < 75).length;
  if (lowSecuritySystems > 0) {
    riskFactors.push(`${lowSecuritySystems} system(s) with security concerns`);
    recommendations.push('Conduct security review and implement fixes');
  }

  const lowComplianceSystems = systems.filter(sys => sys.complianceScore < 80).length;
  if (lowComplianceSystems > 0) {
    riskFactors.push(`${lowComplianceSystems} system(s) with compliance issues`);
    recommendations.push('Address compliance gaps and update policies');
  }

  if (riskFactors.length === 0) {
    recommendations.push('Continue monitoring and maintain current standards');
  }

  return {
    overallRisk,
    riskFactors,
    recommendations
  };
};

/**
 * Format time ago helper
 */
export const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

/**
 * Validate health score ranges
 */
export const validateHealthScores = (scores: {
  performance: number;
  security: number;
  compliance: number;
  reliability: number;
}): boolean => {
  const { performance, security, compliance, reliability } = scores;
  
  return (
    performance >= 0 && performance <= 100 &&
    security >= 0 && security <= 100 &&
    compliance >= 0 && compliance <= 100 &&
    reliability >= 0 && reliability <= 100
  );
};