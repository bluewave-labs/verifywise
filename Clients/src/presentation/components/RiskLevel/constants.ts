export const RISK_LABELS = {
  low: {
    text: "Low risk",
    color: "#B6D7A8",
  },
  medium: {
    text: "Medium risk",
    color: "#FFC107",
  },
  high: {
    text: "High risk",
    color: "#FD7E14",
  },
  critical: {
    text: "Very high risk",
    color: "#DC3545",
  },
  noRisk: {
    text: "Very Low risk",
    color: "#6C757D",
  },
};

export enum Likelihood {
  Rare = 1,
  Unlikely = 2,
  Possible = 3,
  Likely = 4,
  AlmostCertain = 5,
}

export enum Severity {
  VeryLow = 1,
  Low = 2,
  Moderate = 3,
  High = 4,
  VeryHigh = 5,
}
