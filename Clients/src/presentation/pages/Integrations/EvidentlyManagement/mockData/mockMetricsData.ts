/**
 * Mock metrics data for Evidently visualizations
 * This will be replaced with actual API data once backend integration is complete
 */

// ============================================================================
// DRIFT METRICS
// ============================================================================

export interface DriftFeature {
  name: string;
  driftScore: number;
  status: 'healthy' | 'warning' | 'critical';
  pValue?: number;
  statTestName?: string;
}

export interface DriftTimelinePoint {
  timestamp: string;
  score: number;
  driftedFeaturesCount: number;
}

export interface DriftMetrics {
  datasetDriftScore: number;
  totalFeatures: number;
  driftedFeatures: number;
  lastUpdated: string;
  timeline: DriftTimelinePoint[];
  features: DriftFeature[];
}

export const MOCK_DRIFT_METRICS: Record<string, DriftMetrics> = {
  '1': {
    datasetDriftScore: 0.73,
    totalFeatures: 24,
    driftedFeatures: 8,
    lastUpdated: '2025-10-30T10:30:00Z',
    timeline: [
      { timestamp: '2025-10-01', score: 0.45, driftedFeaturesCount: 3 },
      { timestamp: '2025-10-08', score: 0.52, driftedFeaturesCount: 5 },
      { timestamp: '2025-10-15', score: 0.62, driftedFeaturesCount: 6 },
      { timestamp: '2025-10-22', score: 0.68, driftedFeaturesCount: 7 },
      { timestamp: '2025-10-30', score: 0.73, driftedFeaturesCount: 8 }
    ],
    features: [
      { name: 'income', driftScore: 0.89, status: 'critical', pValue: 0.001, statTestName: 'Wasserstein' },
      { name: 'debt_ratio', driftScore: 0.84, status: 'critical', pValue: 0.002, statTestName: 'Wasserstein' },
      { name: 'credit_score', driftScore: 0.71, status: 'warning', pValue: 0.028, statTestName: 'Wasserstein' },
      { name: 'employment_length', driftScore: 0.68, status: 'warning', pValue: 0.035, statTestName: 'Chi-Square' },
      { name: 'loan_amount', driftScore: 0.62, status: 'warning', pValue: 0.041, statTestName: 'Wasserstein' },
      { name: 'age', driftScore: 0.58, status: 'warning', pValue: 0.048, statTestName: 'Wasserstein' },
      { name: 'number_of_loans', driftScore: 0.52, status: 'warning', pValue: 0.055, statTestName: 'Chi-Square' },
      { name: 'late_payments', driftScore: 0.49, status: 'warning', pValue: 0.062, statTestName: 'Chi-Square' },
      { name: 'account_age', driftScore: 0.34, status: 'healthy', pValue: 0.125, statTestName: 'Wasserstein' },
      { name: 'loan_term', driftScore: 0.28, status: 'healthy', pValue: 0.201, statTestName: 'Chi-Square' },
      { name: 'home_ownership', driftScore: 0.22, status: 'healthy', pValue: 0.315, statTestName: 'Chi-Square' },
      { name: 'loan_purpose', driftScore: 0.18, status: 'healthy', pValue: 0.428, statTestName: 'Chi-Square' }
    ]
  },
  '2': {
    datasetDriftScore: 0.91,
    totalFeatures: 18,
    driftedFeatures: 12,
    lastUpdated: '2025-10-30T09:15:00Z',
    timeline: [
      { timestamp: '2025-10-01', score: 0.58, driftedFeaturesCount: 6 },
      { timestamp: '2025-10-08', score: 0.69, driftedFeaturesCount: 8 },
      { timestamp: '2025-10-15', score: 0.78, driftedFeaturesCount: 10 },
      { timestamp: '2025-10-22', score: 0.85, driftedFeaturesCount: 11 },
      { timestamp: '2025-10-30', score: 0.91, driftedFeaturesCount: 12 }
    ],
    features: [
      { name: 'transaction_amount', driftScore: 0.95, status: 'critical', pValue: 0.0001 },
      { name: 'merchant_category', driftScore: 0.92, status: 'critical', pValue: 0.0003 },
      { name: 'location', driftScore: 0.88, status: 'critical', pValue: 0.0012 },
      { name: 'time_of_day', driftScore: 0.82, status: 'critical', pValue: 0.0025 }
    ]
  }
};

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

export interface PerformanceSnapshot {
  timestamp: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  aucRoc?: number;
}

export interface ConfusionMatrix {
  truePositive: number;
  falsePositive: number;
  trueNegative: number;
  falseNegative: number;
}

export interface PerformanceMetrics {
  current: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    aucRoc: number;
  };
  baseline: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    aucRoc: number;
  };
  timeline: PerformanceSnapshot[];
  confusionMatrix?: ConfusionMatrix;
  lastUpdated: string;
}

export const MOCK_PERFORMANCE_METRICS: Record<string, PerformanceMetrics> = {
  '1': {
    current: {
      accuracy: 0.87,
      precision: 0.85,
      recall: 0.89,
      f1Score: 0.87,
      aucRoc: 0.92
    },
    baseline: {
      accuracy: 0.91,
      precision: 0.89,
      recall: 0.93,
      f1Score: 0.91,
      aucRoc: 0.95
    },
    timeline: [
      { timestamp: '2025-10-01', accuracy: 0.91, precision: 0.89, recall: 0.93, f1Score: 0.91, aucRoc: 0.95 },
      { timestamp: '2025-10-08', accuracy: 0.90, precision: 0.88, recall: 0.92, f1Score: 0.90, aucRoc: 0.94 },
      { timestamp: '2025-10-15', accuracy: 0.89, precision: 0.87, recall: 0.91, f1Score: 0.89, aucRoc: 0.93 },
      { timestamp: '2025-10-22', accuracy: 0.88, precision: 0.86, recall: 0.90, f1Score: 0.88, aucRoc: 0.92 },
      { timestamp: '2025-10-30', accuracy: 0.87, precision: 0.85, recall: 0.89, f1Score: 0.87, aucRoc: 0.92 }
    ],
    confusionMatrix: {
      truePositive: 1250,
      falsePositive: 220,
      trueNegative: 3100,
      falseNegative: 180
    },
    lastUpdated: '2025-10-30T10:30:00Z'
  },
  '2': {
    current: {
      accuracy: 0.82,
      precision: 0.79,
      recall: 0.85,
      f1Score: 0.82,
      aucRoc: 0.88
    },
    baseline: {
      accuracy: 0.89,
      precision: 0.87,
      recall: 0.91,
      f1Score: 0.89,
      aucRoc: 0.94
    },
    timeline: [
      { timestamp: '2025-10-01', accuracy: 0.89, precision: 0.87, recall: 0.91, f1Score: 0.89, aucRoc: 0.94 },
      { timestamp: '2025-10-08', accuracy: 0.87, precision: 0.85, recall: 0.89, f1Score: 0.87, aucRoc: 0.92 },
      { timestamp: '2025-10-15', accuracy: 0.85, precision: 0.83, recall: 0.87, f1Score: 0.85, aucRoc: 0.90 },
      { timestamp: '2025-10-22', accuracy: 0.84, precision: 0.81, recall: 0.86, f1Score: 0.83, aucRoc: 0.89 },
      { timestamp: '2025-10-30', accuracy: 0.82, precision: 0.79, recall: 0.85, f1Score: 0.82, aucRoc: 0.88 }
    ],
    confusionMatrix: {
      truePositive: 890,
      falsePositive: 235,
      trueNegative: 2150,
      falseNegative: 145
    },
    lastUpdated: '2025-10-30T09:15:00Z'
  }
};

// ============================================================================
// FAIRNESS METRICS
// ============================================================================

export interface FairnessGroup {
  value: string;
  selectionRate: number;
  count: number;
  truePositiveRate?: number;
  falsePositiveRate?: number;
}

export interface FairnessAttribute {
  name: string;
  groups: FairnessGroup[];
}

export interface FairnessMetrics {
  demographicParity: number;
  equalOpportunity: number;
  disparateImpact: number;
  attributes: FairnessAttribute[];
  lastUpdated: string;
}

export const MOCK_FAIRNESS_METRICS: Record<string, FairnessMetrics> = {
  '1': {
    demographicParity: 0.92,
    equalOpportunity: 0.88,
    disparateImpact: 0.94,
    attributes: [
      {
        name: 'gender',
        groups: [
          { value: 'male', selectionRate: 0.45, count: 1250, truePositiveRate: 0.89, falsePositiveRate: 0.12 },
          { value: 'female', selectionRate: 0.41, count: 1180, truePositiveRate: 0.87, falsePositiveRate: 0.14 }
        ]
      },
      {
        name: 'age_group',
        groups: [
          { value: '18-30', selectionRate: 0.38, count: 680, truePositiveRate: 0.85, falsePositiveRate: 0.15 },
          { value: '31-45', selectionRate: 0.46, count: 920, truePositiveRate: 0.90, falsePositiveRate: 0.11 },
          { value: '46-60', selectionRate: 0.44, count: 710, truePositiveRate: 0.88, falsePositiveRate: 0.13 },
          { value: '60+', selectionRate: 0.35, count: 120, truePositiveRate: 0.82, falsePositiveRate: 0.18 }
        ]
      },
      {
        name: 'ethnicity',
        groups: [
          { value: 'White', selectionRate: 0.47, count: 1100, truePositiveRate: 0.90, falsePositiveRate: 0.11 },
          { value: 'Black', selectionRate: 0.39, count: 450, truePositiveRate: 0.86, falsePositiveRate: 0.15 },
          { value: 'Hispanic', selectionRate: 0.42, count: 520, truePositiveRate: 0.88, falsePositiveRate: 0.13 },
          { value: 'Asian', selectionRate: 0.44, count: 360, truePositiveRate: 0.89, falsePositiveRate: 0.12 }
        ]
      }
    ],
    lastUpdated: '2025-10-30T10:30:00Z'
  },
  '2': {
    demographicParity: 0.85,
    equalOpportunity: 0.82,
    disparateImpact: 0.88,
    attributes: [
      {
        name: 'gender',
        groups: [
          { value: 'male', selectionRate: 0.52, count: 980, truePositiveRate: 0.86, falsePositiveRate: 0.15 },
          { value: 'female', selectionRate: 0.44, count: 890, truePositiveRate: 0.81, falsePositiveRate: 0.19 }
        ]
      },
      {
        name: 'location',
        groups: [
          { value: 'Urban', selectionRate: 0.51, count: 1200, truePositiveRate: 0.87, falsePositiveRate: 0.14 },
          { value: 'Suburban', selectionRate: 0.46, count: 520, truePositiveRate: 0.83, falsePositiveRate: 0.17 },
          { value: 'Rural', selectionRate: 0.42, count: 150, truePositiveRate: 0.79, falsePositiveRate: 0.21 }
        ]
      }
    ],
    lastUpdated: '2025-10-30T09:15:00Z'
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get drift metrics for a model
 */
export const getDriftMetrics = (modelId: string): DriftMetrics | undefined => {
  return MOCK_DRIFT_METRICS[modelId];
};

/**
 * Get performance metrics for a model
 */
export const getPerformanceMetrics = (modelId: string): PerformanceMetrics | undefined => {
  return MOCK_PERFORMANCE_METRICS[modelId];
};

/**
 * Get fairness metrics for a model
 */
export const getFairnessMetrics = (modelId: string): FairnessMetrics | undefined => {
  return MOCK_FAIRNESS_METRICS[modelId];
};

/**
 * Get all metrics for a model
 */
export const getAllMetrics = (modelId: string) => {
  return {
    drift: getDriftMetrics(modelId),
    performance: getPerformanceMetrics(modelId),
    fairness: getFairnessMetrics(modelId)
  };
};
