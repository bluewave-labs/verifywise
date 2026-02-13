import { Chip } from "@mui/material";
import { CheckCircle, RefreshCw, Clock, XCircle } from "lucide-react";

export function getStatusChip(status: string) {
  switch (status) {
    case "completed":
      return (
        <Chip
          label="Completed"
          size="small"
          icon={<CheckCircle size={12} />}
          sx={{ backgroundColor: "#ECFDF5", color: "#065F46", fontSize: 11, height: 22 }}
        />
      );
    case "running":
      return (
        <Chip
          label="Running"
          size="small"
          icon={<RefreshCw size={12} />}
          sx={{ backgroundColor: "#EFF6FF", color: "#1E40AF", fontSize: 11, height: 22 }}
        />
      );
    case "pending":
      return (
        <Chip
          label="Pending"
          size="small"
          icon={<Clock size={12} />}
          sx={{ backgroundColor: "#F9FAFB", color: "#374151", fontSize: 11, height: 22 }}
        />
      );
    case "failed":
      return (
        <Chip
          label="Failed"
          size="small"
          icon={<XCircle size={12} />}
          sx={{ backgroundColor: "#FEF2F2", color: "#991B1B", fontSize: 11, height: 22 }}
        />
      );
    default:
      return <Chip label={status} size="small" sx={{ fontSize: 11, height: 22 }} />;
  }
}

export function getModeChip(mode: string) {
  const labels: Record<string, string> = {
    quantitative_audit: "Quantitative",
    impact_assessment: "Assessment",
    compliance_checklist: "Checklist",
    framework_assessment: "Framework",
    custom: "Custom",
  };
  return (
    <Chip
      label={labels[mode] || mode}
      size="small"
      variant="outlined"
      sx={{ fontSize: 11, height: 22, borderColor: "#d0d5dd" }}
    />
  );
}

export function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
