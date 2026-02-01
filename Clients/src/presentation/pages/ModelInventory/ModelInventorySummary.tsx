import React from "react";
import StatusTileCards, { StatusTileItem } from "../../components/Cards/StatusTileCards";
import { ModelInventorySummary as Summary } from "../../../domain/interfaces/i.modelInventory";

interface ModelInventorySummaryProps {
  summary: Summary;
}

const ModelInventorySummary: React.FC<ModelInventorySummaryProps> = ({ summary }) => {
  const items: StatusTileItem[] = [
    { key: "approved", label: "Approved", count: summary.approved, color: "#4CAF50" },
    { key: "restricted", label: "Restricted", count: summary.restricted, color: "#FF5722" },
    { key: "pending", label: "Pending", count: summary.pending, color: "#FF9800" },
    { key: "blocked", label: "Blocked", count: summary.blocked, color: "#F44336" },
  ];

  return <StatusTileCards items={items} entityName="model" />;
};

export default ModelInventorySummary;
