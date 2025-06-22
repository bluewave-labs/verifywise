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

export const SEVERITY_COLOR_LOOKUP: Record<string, string> = Object.entries(RISK_LABELS).reduce((acc, [key, val]) => {
  acc[key.toLowerCase()] = val.color;
  acc[val.text.toLowerCase()] = val.color;
  return acc;
}, {} as Record<string, string>);

export const getSeverityColorByText = (severity: string): string => {
  if (!severity) return '#B0B0B0';
  const color = SEVERITY_COLOR_LOOKUP[severity.toLowerCase().trim()];
  return color ?? '#B0B0B0';
};

// Reusable chip style object to avoid repetitive styling
export const getRiskChipStyle = (theme: any) => ({
  color: 'white',
  fontWeight: 500,
  borderRadius: theme.shape.borderRadius,
  height: 24,
});

