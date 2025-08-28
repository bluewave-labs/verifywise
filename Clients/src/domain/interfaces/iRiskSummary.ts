export interface risksSummary {
  veryHighRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  veryLowRisks: number;
}

// Enhanced interface for risk trends and analytics
export interface EnhancedRiskSummary extends risksSummary {
  trends?: {
    veryHighTrend: RiskTrend;
    highTrend: RiskTrend;
    mediumTrend: RiskTrend;
    lowTrend: RiskTrend;
    veryLowTrend: RiskTrend;
  };
  velocity?: {
    newRisksThisWeek: number;
    resolvedRisksThisWeek: number;
    overdueRisks: number;
  };
  metrics?: {
    totalRisks: number;
    mitigationProgress: number; // percentage
    riskVelocity: number; // risks per week
  };
}

export interface RiskTrend {
  direction: 'up' | 'down' | 'stable';
  change: number;
  period: 'week' | 'month';
}

export interface RiskMetrics {
  riskVelocity: number;
  mitigationProgress: number;
  overdueCount: number;
  totalFinancialImpact: number;
}
