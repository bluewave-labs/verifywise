import { Assessments, Controls } from "../types/projectStatus.types";

export interface MetricSectionProps {
  title: string;
  metricType?: "compliance" | "risk";
  assessments: Assessments;
  controls: Controls;
}
