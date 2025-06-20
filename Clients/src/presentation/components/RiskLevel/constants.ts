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

