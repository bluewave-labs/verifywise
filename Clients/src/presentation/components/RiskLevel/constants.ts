export const RISK_LABELS = {
    low: {
      text: "Low risk",
      color: "#B6D7A8"
    },
    medium: {
      text: "Medium risk",
      color: "#FFC107"
    },
    high: {
      text: "High risk",
      color: "#FD7E14"
    },
    critical: {
      text: "Critical risk",
      color: "#DC3545"
    },
    noRisk: {
      text: "No risk",
      color: "#6C757D"
    }
}

export enum Likelihood {
  Rare = 1,
  Unlikely = 2,
  Possible = 3,
  Likely = 4,
  AlmostCertain = 5
}

export enum Severity {
  Negligible = 1,
  Minor = 2,
  Moderate = 3,
  Major = 4,
  Critical = 5
}