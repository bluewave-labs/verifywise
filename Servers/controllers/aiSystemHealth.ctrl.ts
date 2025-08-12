import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { AISystemHealth } from '../domain.layer/models/aiSystemHealth/aiSystemHealth.model';
import { AIHealthAlert } from '../domain.layer/models/aiHealthAlert/aiHealthAlert.model';
import { AIHealthMetrics } from '../domain.layer/models/aiHealthMetrics/aiHealthMetrics.model';
import { STATUS_CODE } from '../utils/statusCode.utils';
import { logProcessing, logSuccess, logFailure } from '../utils/logger/logHelper';

/**
 * Get all AI systems health data for an organization
 */
export const getAISystemsHealth = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const { page = 1, limit = 10, systemType, status } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const whereClause: any = {
      organizationId: parseInt(organizationId),
      isActive: true
    };

    if (systemType) {
      whereClause.systemType = systemType;
    }

    if (status) {
      whereClause.status = status;
    }

    const systems = await AISystemHealth.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit as string),
      offset,
      order: [['lastChecked', 'DESC']],
      include: [
        {
          model: AIHealthAlert,
          as: 'alerts',
          where: { status: 'active' },
          required: false
        }
      ]
    });

    const totalPages = Math.ceil(systems.count / parseInt(limit as string));

    res.status(200).json(STATUS_CODE[200]({
      systems: systems.rows,
      pagination: {
        currentPage: parseInt(page as string),
        totalPages,
        totalItems: systems.count,
        itemsPerPage: parseInt(limit as string)
      }
    }));

  } catch (error) {
    logFailure({
      eventType: 'Read',
      description: `Error fetching AI systems health: ${error}`,
      functionName: 'getAISystemsHealth',
      fileName: 'aiSystemHealth.ctrl.ts',
      error: error as Error
    });
    res.status(500).json(STATUS_CODE[500](error));
  }
};

/**
 * Get health overview and metrics for dashboard
 */
export const getHealthOverview = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;

    // Get all active systems
    const systems = await AISystemHealth.findAll({
      where: {
        organizationId: parseInt(organizationId),
        isActive: true
      }
    });

    // Calculate overall metrics
    const totalSystems = systems.length;
    
    if (totalSystems === 0) {
      return res.status(200).json(STATUS_CODE[200]({
        systemHealth: {
          overall: 0,
          performance: 0,
          security: 0,
          compliance: 0,
          reliability: 0
        },
        metrics: {
          totalSystems: 0,
          activeAlerts: 0,
          riskScore: 'Unknown',
          uptime: '0%'
        },
        healthTrends: []
      }));
    }

    const overallScore = Math.round(
      systems.reduce((sum, system) => sum + system.overallScore, 0) / totalSystems
    );
    
    const performanceScore = Math.round(
      systems.reduce((sum, system) => sum + system.performanceScore, 0) / totalSystems
    );
    
    const securityScore = Math.round(
      systems.reduce((sum, system) => sum + system.securityScore, 0) / totalSystems
    );
    
    const complianceScore = Math.round(
      systems.reduce((sum, system) => sum + system.complianceScore, 0) / totalSystems
    );
    
    const reliabilityScore = Math.round(
      systems.reduce((sum, system) => sum + system.reliabilityScore, 0) / totalSystems
    );

    const averageUptime = systems.reduce((sum, system) => sum + system.uptime, 0) / totalSystems;

    // Get active alerts count
    const activeAlerts = await AIHealthAlert.count({
      where: {
        organizationId: parseInt(organizationId),
        status: 'active'
      }
    });

    // Determine risk score based on overall health
    let riskScore = 'Low';
    if (overallScore < 70) riskScore = 'High';
    else if (overallScore < 85) riskScore = 'Medium';

    // Get health trends for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const healthTrends = await AISystemHealth.findAll({
      where: {
        organizationId: parseInt(organizationId),
        isActive: true,
        updatedAt: {
          [Op.gte]: sixMonthsAgo
        }
      },
      attributes: [
        [AISystemHealth.sequelize!.fn('DATE_TRUNC', 'month', AISystemHealth.sequelize!.col('updated_at')), 'month'],
        [AISystemHealth.sequelize!.fn('AVG', AISystemHealth.sequelize!.col('overall_score')), 'avgScore']
      ],
      group: [AISystemHealth.sequelize!.fn('DATE_TRUNC', 'month', AISystemHealth.sequelize!.col('updated_at'))],
      order: [[AISystemHealth.sequelize!.fn('DATE_TRUNC', 'month', AISystemHealth.sequelize!.col('updated_at')), 'ASC']]
    });

    const response = {
      systemHealth: {
        overall: overallScore,
        performance: performanceScore,
        security: securityScore,
        compliance: complianceScore,
        reliability: reliabilityScore
      },
      metrics: {
        totalSystems,
        activeAlerts,
        riskScore,
        uptime: `${averageUptime.toFixed(1)}%`
      },
      healthTrends: healthTrends.map((trend: any) => ({
        month: new Date(trend.getDataValue('month')).toLocaleString('default', { month: 'short' }),
        score: Math.round(trend.getDataValue('avgScore'))
      }))
    };

    res.status(200).json(STATUS_CODE[200](response));

  } catch (error) {
    logFailure({
      eventType: 'Read',
      description: `Error fetching health overview: ${error}`,
      functionName: 'getHealthOverview',
      fileName: 'aiSystemHealth.ctrl.ts',
      error: error as Error
    });
    res.status(500).json(STATUS_CODE[500](error));
  }
};

/**
 * Get active alerts for the organization
 */
export const getActiveAlerts = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const { limit = 5 } = req.query;

    const alerts = await AIHealthAlert.findAll({
      where: {
        organizationId: parseInt(organizationId),
        status: 'active'
      },
      include: [
        {
          model: AISystemHealth,
          as: 'systemHealth',
          attributes: ['systemName']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit as string)
    });

    const formattedAlerts = alerts.map(alert => ({
      id: alert.id,
      type: alert.alertType,
      title: alert.title,
      description: alert.description,
      severity: alert.severity,
      timestamp: getTimeAgo(alert.createdAt),
      project: (alert as any).systemHealth?.systemName || 'Unknown System'
    }));

    res.status(200).json(STATUS_CODE[200](formattedAlerts));

  } catch (error) {
    logFailure({
      eventType: 'Read',
      description: `Error fetching active alerts: ${error}`,
      functionName: 'getActiveAlerts',
      fileName: 'aiSystemHealth.ctrl.ts',
      error: error as Error
    });
    res.status(500).json(STATUS_CODE[500](error));
  }
};

/**
 * Get risk predictions based on historical data and current trends
 */
export const getRiskPredictions = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;

    // This is a simplified version - in a real implementation, 
    // you'd use machine learning models to generate predictions
    const systems = await AISystemHealth.findAll({
      where: {
        organizationId: parseInt(organizationId),
        isActive: true
      }
    });

    if (systems.length === 0) {
      return res.status(200).json(STATUS_CODE[200]([])); 
    }

    const predictions = [];

    // Model Performance Prediction
    const avgPerformance = systems.reduce((sum, sys) => sum + sys.performanceScore, 0) / systems.length;
    predictions.push({
      category: 'Model Performance',
      risk: avgPerformance >= 85 ? 'Low' : avgPerformance >= 75 ? 'Medium' : 'High',
      trend: avgPerformance < 80 ? 'increasing' : 'stable',
      prediction: avgPerformance < 80 
        ? `Potential ${Math.round(100 - avgPerformance)}% performance degradation risk in next 30 days`
        : 'Performance expected to remain stable',
      confidence: Math.round(Math.min(95, 60 + avgPerformance / 2))
    });

    // Compliance Drift Prediction
    const avgCompliance = systems.reduce((sum, sys) => sum + sys.complianceScore, 0) / systems.length;
    predictions.push({
      category: 'Compliance Drift',
      risk: avgCompliance >= 90 ? 'Low' : avgCompliance >= 80 ? 'Medium' : 'High',
      trend: avgCompliance >= 85 ? 'stable' : 'increasing',
      prediction: avgCompliance >= 85 
        ? 'Compliance status expected to remain stable'
        : 'Compliance drift detected, review required',
      confidence: Math.round(Math.min(95, 70 + avgCompliance / 4))
    });

    // Security Vulnerabilities Prediction
    const avgSecurity = systems.reduce((sum, sys) => sum + sys.securityScore, 0) / systems.length;
    predictions.push({
      category: 'Security Vulnerabilities',
      risk: avgSecurity >= 85 ? 'Low' : avgSecurity >= 75 ? 'Medium' : 'High',
      trend: avgSecurity < 80 ? 'increasing' : 'stable',
      prediction: avgSecurity < 80 
        ? 'New attack vectors identified, security update recommended'
        : 'Security posture remains strong',
      confidence: Math.round(Math.min(90, 65 + avgSecurity / 3))
    });

    res.status(200).json(STATUS_CODE[200](predictions));

  } catch (error) {
    logFailure({
      eventType: 'Read',
      description: `Error generating risk predictions: ${error}`,
      functionName: 'getRiskPredictions',
      fileName: 'aiSystemHealth.ctrl.ts',
      error: error as Error
    });
    res.status(500).json(STATUS_CODE[500](error));
  }
};

/**
 * Create or update AI system health record
 */
export const createOrUpdateSystemHealth = async (req: Request, res: Response) => {
  try {
    const {
      systemName,
      systemType,
      overallScore,
      performanceScore,
      securityScore,
      complianceScore,
      reliabilityScore,
      uptime,
      organizationId,
      projectId,
      metadata
    } = req.body;

    // Determine status based on overall score
    let status: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
    if (overallScore >= 90) status = 'excellent';
    else if (overallScore >= 80) status = 'good';
    else if (overallScore >= 70) status = 'fair';

    const [systemHealth, created] = await AISystemHealth.upsert({
      systemName,
      systemType,
      overallScore,
      performanceScore,
      securityScore,
      complianceScore,
      reliabilityScore,
      status,
      uptime,
      organizationId,
      projectId,
      metadata,
      lastChecked: new Date(),
      isActive: true
    }, {
      conflictFields: ['systemName', 'organizationId']
    });

    res.status(created ? 201 : 200).json(created ? STATUS_CODE[201](systemHealth) : STATUS_CODE[200](systemHealth));

  } catch (error) {
    logFailure({
      eventType: 'Create',
      description: `Error creating/updating system health: ${error}`,
      functionName: 'createOrUpdateSystemHealth',
      fileName: 'aiSystemHealth.ctrl.ts',
      error: error as Error
    });
    res.status(500).json(STATUS_CODE[500](error));
  }
};

/**
 * Create health alert
 */
export const createHealthAlert = async (req: Request, res: Response) => {
  try {
    const {
      systemHealthId,
      alertType,
      title,
      description,
      severity,
      organizationId,
      projectId,
      metadata
    } = req.body;

    const alert = await AIHealthAlert.create({
      systemHealthId,
      alertType,
      title,
      description,
      severity,
      organizationId,
      projectId,
      metadata,
      status: 'active'
    });

    res.status(201).json(STATUS_CODE[201](alert));

  } catch (error) {
    logFailure({
      eventType: 'Create',
      description: `Error creating health alert: ${error}`,
      functionName: 'createHealthAlert',
      fileName: 'aiSystemHealth.ctrl.ts',
      error: error as Error
    });
    res.status(500).json(STATUS_CODE[500](error));
  }
};

/**
 * Resolve health alert
 */
export const resolveHealthAlert = async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const { resolvedBy } = req.body;

    const alert = await AIHealthAlert.findByPk(alertId);
    
    if (!alert) {
      return res.status(404).json(STATUS_CODE[404](null));
    }

    await alert.update({
      status: 'resolved',
      resolvedAt: new Date(),
      resolvedBy
    });

    res.status(200).json(STATUS_CODE[200](alert));

  } catch (error) {
    logFailure({
      eventType: 'Update',
      description: `Error resolving alert: ${error}`,
      functionName: 'resolveHealthAlert',
      fileName: 'aiSystemHealth.ctrl.ts',
      error: error as Error
    });
    res.status(500).json(STATUS_CODE[500](error));
  }
};

/**
 * Record health metrics
 */
export const recordHealthMetrics = async (req: Request, res: Response) => {
  try {
    const {
      systemHealthId,
      metricType,
      metricValue,
      metricUnit,
      threshold,
      organizationId,
      metadata
    } = req.body;

    const isWithinThreshold = threshold ? metricValue <= threshold : true;

    const metrics = await AIHealthMetrics.create({
      systemHealthId,
      metricType,
      metricValue,
      metricUnit,
      threshold,
      isWithinThreshold,
      organizationId,
      metadata,
      recordedAt: new Date()
    });

    res.status(201).json(STATUS_CODE[201](metrics));

  } catch (error) {
    logFailure({
      eventType: 'Create',
      description: `Error recording health metrics: ${error}`,
      functionName: 'recordHealthMetrics',
      fileName: 'aiSystemHealth.ctrl.ts',
      error: error as Error
    });
    res.status(500).json(STATUS_CODE[500](error));
  }
};

// Helper function to format timestamps
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 60) {
    return `${diffMinutes} minutes ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else {
    return `${diffDays} days ago`;
  }
}