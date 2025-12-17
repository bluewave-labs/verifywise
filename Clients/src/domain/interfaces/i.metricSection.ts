import { Assessments } from "../../application/hooks/useProjectStatus";

import { Controls } from "../../application/hooks/useProjectStatus";

export interface MetricSectionProps {
  title: string;
  metricType?: "compliance" | "risk";
  assessments: Assessments;
  controls: Controls;
}
