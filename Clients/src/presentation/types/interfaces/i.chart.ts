// Re-export IStatusData from domain layer (pure data type)
import type { IStatusData } from "../../../domain/interfaces/i.statusData";
export type { IStatusData };

export interface IStatusDonutChartProps {
  data: IStatusData[];
  total: number;
  size?: number;
}
