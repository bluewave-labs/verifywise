export interface IAISystemHealth {
  id?: number;
  systemName: string;
  systemType: 'recommendation_engine' | 'fraud_detection' | 'nlp_service' | 
    'image_recognition' | 'sentiment_analysis' | 'chatbot' | 'predictive_analytics' | 'other';
  overallScore: number;
  performanceScore: number;
  securityScore: number;
  complianceScore: number;
  reliabilityScore: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  lastChecked: Date;
  uptime: number;
  organizationId?: number;
  projectId?: number;
  metadata?: Record<string, any>;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAIHealthAlert {
  id?: number;
  systemHealthId: number;
  alertType: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'dismissed';
  organizationId?: number;
  projectId?: number;
  metadata?: Record<string, any>;
  resolvedAt?: Date;
  resolvedBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAIHealthMetrics {
  id?: number;
  systemHealthId: number;
  metricType: 'response_time' | 'accuracy' | 'throughput' | 'error_rate' | 
    'cpu_usage' | 'memory_usage' | 'disk_usage' | 'network_latency' | 
    'model_drift' | 'data_quality' | 'prediction_confidence' | 'custom';
  metricValue: number;
  metricUnit?: string;
  threshold?: number;
  isWithinThreshold: boolean;
  recordedAt: Date;
  organizationId?: number;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IHealthOverview {
  systemHealth: {
    overall: number;
    performance: number;
    security: number;
    compliance: number;
    reliability: number;
  };
  metrics: {
    totalSystems: number;
    activeAlerts: number;
    riskScore: 'Low' | 'Medium' | 'High';
    uptime: string;
  };
  healthTrends: Array<{
    month: string;
    score: number;
  }>;
}

export interface IRiskPrediction {
  category: string;
  risk: 'Low' | 'Medium' | 'High';
  trend: 'increasing' | 'stable' | 'decreasing';
  prediction: string;
  confidence: number;
}

export interface ISystemHealthResponse {
  systems: IAISystemHealth[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface IAlertResponse {
  id: number;
  type: string;
  title: string;
  description: string;
  severity: string;
  timestamp: string;
  project: string;
}