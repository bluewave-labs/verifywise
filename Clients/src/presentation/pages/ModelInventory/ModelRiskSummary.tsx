import React from "react";
import StatusTileCards, { StatusTileItem } from "../../components/Cards/StatusTileCards";
import { ModelRiskLevel } from "../../../domain/interfaces/i.modelRisk";
import { ModelRiskSummaryProps } from "../../../domain/interfaces/i.modelInventory";

const ModelRiskSummary: React.FC<ModelRiskSummaryProps> = ({ modelRisks }) => {
  const riskLevels = [
    { key: ModelRiskLevel.LOW, label: "Low", color: "#4CAF50" },
    { key: ModelRiskLevel.MEDIUM, label: "Medium", color: "#FF9800" },
    { key: ModelRiskLevel.HIGH, label: "High", color: "#FF5722" },
    { key: ModelRiskLevel.CRITICAL, label: "Critical", color: "#F44336" },
  ];

  const items: StatusTileItem[] = riskLevels.map((level) => ({
    key: level.key,
    label: level.label,
    count: modelRisks.filter((risk) => risk.risk_level === level.key).length,
    color: level.color,
  }));

  return <StatusTileCards items={items} entityName="risk" />;
};

export default ModelRiskSummary;
