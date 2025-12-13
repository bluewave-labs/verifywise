import { RiskModel } from "../models/Common/Risks/risk.model";

export interface ICategoryGroup {
  name: string;
  risks: RiskModel[];
  count: number;
  riskLevels: {
    veryHigh: number;
    high: number;
    medium: number;
    low: number;
    veryLow: number;
  };
}
