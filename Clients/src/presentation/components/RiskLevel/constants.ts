export const RISK_LABELS = {
  low: {
    text: "Minor",
    color: "#B8D39C",
  },
  medium: {
    text: "Moderate",
    color: "#D6B971",
  },
  high: {
    text: "Major",
    color: "#D68B61",
  },
  critical: {
    text: "Catastrophic",
    color: "#C63622",
  },
  noRisk: {
    text: "Negligible",
    color: "#52AB43",
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
