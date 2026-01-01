import React from "react";
import StatusTileCards, { StatusTileItem } from "../../components/Cards/StatusTileCards";
import { PolicyStatusCardProps } from "../../types/interfaces/i.policy";

const PolicyStatusCard: React.FC<PolicyStatusCardProps> = ({ policies }) => {
  const statusLevels = [
    { key: "Draft", label: "Draft", color: "#9E9E9E" },
    { key: "Under Review", label: "Under review", color: "#FF9800" },
    { key: "Approved", label: "Approved", color: "#4CAF50" },
    { key: "Published", label: "Published", color: "#2196F3" },
    { key: "Archived", label: "Archived", color: "#757575" },
    { key: "Deprecated", label: "Deprecated", color: "#F44336" },
  ];

  const items: StatusTileItem[] = statusLevels.map((level) => ({
    key: level.key,
    label: level.label,
    count: policies.filter((p) => p.status === level.key).length,
    color: level.color,
  }));

  return (
    <StatusTileCards
      items={items}
      entityName="policy"
      cardSx={{ paddingX: { xs: "15px", sm: "20px" } }}
    />
  );
};

export default PolicyStatusCard;
