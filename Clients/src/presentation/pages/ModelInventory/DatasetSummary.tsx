import React from "react";
import StatusTileCards, { StatusTileItem } from "../../components/Cards/StatusTileCards";
import { DatasetSummary as Summary } from "../../../domain/interfaces/i.dataset";

interface DatasetSummaryProps {
  summary: Summary;
  onCardClick?: (statusKey: string) => void;
  selectedStatus?: string | null;
}

const DatasetSummary: React.FC<DatasetSummaryProps> = ({
  summary,
  onCardClick,
  selectedStatus,
}) => {
  const items: StatusTileItem[] = [
    { key: "total", label: "Total", count: summary.total, color: "#4B5563" },
    { key: "draft", label: "Draft", count: summary.draft, color: "#9CA3AF" },
    { key: "active", label: "Active", count: summary.active, color: "#4CAF50" },
    { key: "deprecated", label: "Deprecated", count: summary.deprecated, color: "#FF9800" },
    { key: "archived", label: "Archived", count: summary.archived, color: "#6B7280" },
  ];

  return (
    <StatusTileCards
      items={items}
      entityName="dataset"
      onCardClick={onCardClick}
      selectedKey={selectedStatus}
    />
  );
};

export default DatasetSummary;
