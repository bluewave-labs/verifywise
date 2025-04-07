export const RISK_LABELS = {
  low: {
    text: "Low risk",
    color: "#B8D39C",
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
    color: "#52AB43",
  },
  negligible: {
    text: "Negligible",
    color: "#52AB43",
  },
  minor: {
    text: "Minor",
    color: "#B8D39C",
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

