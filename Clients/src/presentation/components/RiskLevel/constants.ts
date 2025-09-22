export const RISK_LABELS = {
  low: {
    text: "Low risk",
    color: "#2E7D32",   // darker green
  },
  medium: {
    text: "Medium risk",
    color: "#8D6E63",   // darker brown (instead of washed yellow)
  },
  high: {
    text: "High risk",
    color: "#E65100",   // deep orange
  },
  critical: {
    text: "Very high risk",
    color: "#B71C1C",   // stronger red
  },
  noRisk: {
    text: "Very low risk",
    color: "#33691E",   // deep green
  },
  negligible: {
    text: "Negligible",
    color: "#33691E",
  },
  minor: {
    text: "Minor",
    color: "#2E7D32",
  },
  moderate: {
    text: "Moderate",
    color: "#8D6E63",
  },
  major: {
    text: "Major",
    color: "#E65100",
  },
  catastrophic: {
    text: "Catastrophic",
    color: "#B71C1C",
  },
  overdue: {
    text: "Overdue",
    color: "#B71C1C",   // use same color as critical/catastrophic
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

export const SEVERITY_COLOR_LOOKUP: Record<string, string> = Object.entries(RISK_LABELS).reduce((acc, [key, val]) => {
  acc[key.toLowerCase()] = val.color;
  acc[val.text.toLowerCase()] = val.color;
  return acc;
}, {} as Record<string, string>);

// Add model risk level mappings
SEVERITY_COLOR_LOOKUP['low'] = RISK_LABELS.low.color;
SEVERITY_COLOR_LOOKUP['medium'] = RISK_LABELS.medium.color;
SEVERITY_COLOR_LOOKUP['high'] = RISK_LABELS.high.color;
SEVERITY_COLOR_LOOKUP['critical'] = RISK_LABELS.critical.color;

export const getSeverityColorByText = (severity: string): string => {
  if (!severity) return '#B0B0B0';
  const color = SEVERITY_COLOR_LOOKUP[severity.toLowerCase().trim()];
  return color ?? '#B0B0B0';
};

// Reusable chip style object to avoid repetitive styling
export const getRiskChipStyle = () => ({
  color: 'white',
  fontWeight: 500,
  borderRadius: 12,
  height: 24,
});
