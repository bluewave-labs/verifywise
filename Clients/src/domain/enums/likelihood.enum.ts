export enum Likelihood {
  Rare = "Rare",
  Unlikely = "Unlikely",
  Possible = "Possible",
  Likely = "Likely",
  AlmostCertain = "Almost Certain",
}

export enum RiskLevelLikelihood {
  Rare = 1,
  Unlikely = 2,
  Possible = 3,
  Likely = 4,
  AlmostCertain = 5,
}

export enum RiskLevelSeverity {
  Negligible = 1,
  Minor = 2,
  Moderate = 3,
  Major = 4,
  Catastrophic = 5,
}
