export interface IStatusData {
  label: string;
  value: number;
  color: string;
}

export interface IStatusDonutChartProps {
  data: IStatusData[];
  total: number;
  size?: number;
}
