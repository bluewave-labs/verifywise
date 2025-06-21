export const RISK_LABELS = {
  low: {
    text: "Low risk",
    color: "#52AB43",
  },
  medium: {
    text: "Medium risk",
    color: "#D6B971",
  },
  high: {
    text: "High risk",
    color: "#D68B61",
  },
  critical: {
    text: "Very high risk",
    color: "#C63622",
  },
  noRisk: {
    text: "Very low risk",
    color: "#B8D39C",
  },
  negligible: {
    text: "Negligible",
    color: "#B8D39C",
  },
  minor: {
    text: "Minor",
    color: "#52AB43",
  },
  moderate: {
    text: "Moderate",
    color: "#D6B971",
  },
  major: {
    text: "Major",
    color: "#D68B61",
  },
  catastrophic: {
    text: "Catastrophic",
    color: "#C63622",
  }
};

export enum Likelihood {
  Rare = 1,
  Unlikely = 2,
  Possible = 3,
  Likely = 4,
  AlmostCertain = 5,
}

export enum Severity {
  Negligible = 1,
  Minor = 2,
  Moderate = 3,
  Major = 4,
  Catastrophic = 5,
}

export const RISK_COLOR_BY_TEXT: Record<string, string> = Object.values(RISK_LABELS).reduce(
  (acc, { text, color }) => {
    acc[text] = color;
    return acc;
  },
  {} as Record<string, string>
);

export const getSeverityColorByText = (severity: string): string => {
  if (!severity) return '#B0B0B0';
  
  // Normalize the input to lowercase for case-insensitive comparison
  const normalizedSeverity = severity.toLowerCase().trim();
  
  // Direct mapping using RISK_LABELS colors
  switch (normalizedSeverity) {
    // Severity values
    case 'negligible':
      return RISK_LABELS.negligible.color;
    case 'minor':
      return RISK_LABELS.minor.color;
    case 'moderate':
      return RISK_LABELS.moderate.color;
    case 'major':
      return RISK_LABELS.major.color;
    case 'catastrophic':
      return RISK_LABELS.catastrophic.color;
    
    // Risk level values
    case 'very low risk':
    case 'no risk':
      return RISK_LABELS.noRisk.color;
    case 'low risk':
      return RISK_LABELS.low.color;
    case 'medium risk':
      return RISK_LABELS.medium.color;
    case 'high risk':
      return RISK_LABELS.high.color;
    case 'very high risk':
      return RISK_LABELS.critical.color;
    
    default:
      return '#B0B0B0';
  }
};

// Reusable chip style object to avoid repetitive styling
export const getRiskChipStyle = (backgroundColor: string, theme: any) => ({
  backgroundColor,
  color: 'white',
  fontWeight: 500,
  borderRadius: theme.shape.borderRadius,
  height: 24,
});

