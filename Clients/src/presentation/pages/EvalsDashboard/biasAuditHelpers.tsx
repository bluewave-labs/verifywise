import Chip from "../../components/Chip";

export function getStatusChip(status: string) {
  switch (status) {
    case "completed":
      return (
        <Chip
          label="Completed"
          size="small"
          uppercase={false}
          backgroundColor="#ECFDF5"
          textColor="#065F46"
        />
      );
    case "running":
      return (
        <Chip
          label="Running"
          size="small"
          uppercase={false}
          backgroundColor="#EFF6FF"
          textColor="#1E40AF"
        />
      );
    case "pending":
      return (
        <Chip
          label="Pending"
          size="small"
          uppercase={false}
          backgroundColor="#F9FAFB"
          textColor="#374151"
        />
      );
    case "failed":
      return (
        <Chip
          label="Failed"
          size="small"
          uppercase={false}
          backgroundColor="#FEF2F2"
          textColor="#991B1B"
        />
      );
    default:
      return <Chip label={status} size="small" uppercase={false} />;
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
      uppercase={false}
      variant="default"
    />
  );
}

export function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
