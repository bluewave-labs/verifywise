/**
 * Mock data for Evidently monitored models
 * This will be replaced with actual API data once backend integration is complete
 */

export interface EvidentlyModel {
  id: string;
  modelName: string;
  projectId: string;
  projectName: string;
  lastSync: string;
  driftStatus: 'healthy' | 'warning' | 'critical';
  performanceStatus: 'healthy' | 'warning' | 'critical';
  fairnessStatus: 'healthy' | 'warning' | 'critical';
  metricsCount: number;
}

export const MOCK_EVIDENTLY_MODELS: EvidentlyModel[] = [
  {
    id: '1',
    modelName: 'Credit Risk Model v2.1',
    projectId: 'proj-credit-001',
    projectName: 'Credit Scoring System',
    lastSync: '2025-10-30T10:30:00Z',
    driftStatus: 'warning',
    performanceStatus: 'healthy',
    fairnessStatus: 'healthy',
    metricsCount: 156
  },
  {
    id: '2',
    modelName: 'Fraud Detection Model',
    projectId: 'proj-fraud-001',
    projectName: 'Transaction Fraud System',
    lastSync: '2025-10-30T09:15:00Z',
    driftStatus: 'critical',
    performanceStatus: 'warning',
    fairnessStatus: 'warning',
    metricsCount: 243
  },
  {
    id: '3',
    modelName: 'Customer Churn Predictor',
    projectId: 'proj-churn-001',
    projectName: 'Churn Analysis',
    lastSync: '2025-10-30T08:45:00Z',
    driftStatus: 'healthy',
    performanceStatus: 'healthy',
    fairnessStatus: 'healthy',
    metricsCount: 89
  },
  {
    id: '4',
    modelName: 'Loan Approval Model v3.0',
    projectId: 'proj-loan-002',
    projectName: 'Lending Platform',
    lastSync: '2025-10-29T16:20:00Z',
    driftStatus: 'healthy',
    performanceStatus: 'warning',
    fairnessStatus: 'critical',
    metricsCount: 312
  },
  {
    id: '5',
    modelName: 'Product Recommendation Engine',
    projectId: 'proj-recom-001',
    projectName: 'E-Commerce Recommendations',
    lastSync: '2025-10-29T14:30:00Z',
    driftStatus: 'warning',
    performanceStatus: 'healthy',
    fairnessStatus: 'healthy',
    metricsCount: 178
  }
];

/**
 * Get model by ID
 */
export const getModelById = (id: string): EvidentlyModel | undefined => {
  return MOCK_EVIDENTLY_MODELS.find(model => model.id === id);
};

/**
 * Get status color for display
 */
export const getStatusColor = (status: 'healthy' | 'warning' | 'critical'): string => {
  switch (status) {
    case 'healthy':
      return '#10B981'; // Green
    case 'warning':
      return '#F59E0B'; // Orange
    case 'critical':
      return '#EF4444'; // Red
    default:
      return '#6B7280'; // Gray
  }
};

/**
 * Get status label
 */
export const getStatusLabel = (status: 'healthy' | 'warning' | 'critical'): string => {
  switch (status) {
    case 'healthy':
      return 'Healthy';
    case 'warning':
      return 'Warning';
    case 'critical':
      return 'Critical';
    default:
      return 'Unknown';
  }
};
