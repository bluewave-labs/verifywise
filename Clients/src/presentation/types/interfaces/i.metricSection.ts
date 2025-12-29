import { Assessments, Controls } from "../../../domain/types/projectStatus.types";

export interface MetricSectionProps {
  title: string;
  metricType?: "compliance" | "risk";
  assessments: Assessments;
  controls: Controls;
}
