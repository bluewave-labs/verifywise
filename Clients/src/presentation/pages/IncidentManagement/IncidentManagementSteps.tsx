import { BarChart3, Filter, ShieldAlert, AlertCircle } from "lucide-react";
import { IPageTourStep } from "../../../domain/interfaces/i.tour";

const IncidentManagementSteps: IPageTourStep[] = [
  {
    target: '[data-joyride-id="add-incident-button"]',
    content: {
      header: "Log new incidents",
      body: "Document AI-related incidents with full details including severity, impact assessment, affected parties, immediate mitigations, and planned corrective actions.",
      icon: <AlertCircle size={20} color="#ffffff" />,
    },
    placement: "bottom-end",
  },
  {
    target: '[data-joyride-id="incident-status-cards"]',
    content: {
      header: "Incident Lifecycle Overview",
      body: "Monitor incidents across their lifecycle: Open, Investigating, Mitigated, and Closed. Track resolution progress and identify incidents requiring immediate attention.",
      icon: <BarChart3 size={20} color="#ffffff" />,
    },
    placement: "bottom",
  },
  {
    target: '[data-joyride-id="incident-status-filter"]',
    content: {
      header: "Filter by status",
      body: "Focus on incidents at specific stages of resolution. Filter by Open, Investigating, Mitigated, or Closed to manage your incident response workflow.",
      icon: <Filter size={20} color="#ffffff" />,
    },
    placement: "bottom",
  },
  {
    target: '[data-joyride-id="incident-severity-filter"]',
    content: {
      header: "Prioritize by Severity",
      body: "Filter incidents by severity level: Minor, Serious, or Very Serious. Focus on high-severity incidents that require immediate investigation and mitigation.",
      icon: <ShieldAlert size={20} color="#ffffff" />,
    },
    placement: "bottom",
  },
  {
    target: '[data-joyride-id="incident-approval-filter"]',
    content: {
      header: "Track Approval Status",
      body: "Monitor incident approval workflow. Filter by Pending, Approved, Rejected, or Not Required to ensure proper incident review and sign-off.",
      icon: <Filter size={20} color="#ffffff" />,
    },
    placement: "bottom",
  },
];

export default IncidentManagementSteps;
