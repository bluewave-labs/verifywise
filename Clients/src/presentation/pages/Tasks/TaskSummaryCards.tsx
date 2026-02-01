import React from "react";
import StatusTileCards, { StatusTileItem } from "../../components/Cards/StatusTileCards";
import { TaskSummary } from "../../../domain/interfaces/i.task";

interface TaskSummaryCardsProps {
  summary: TaskSummary;
}

const TaskSummaryCards: React.FC<TaskSummaryCardsProps> = ({ summary }) => {
  const items: StatusTileItem[] = [
    { key: "total", label: "Total", count: summary.total, color: "#4B5563" },
    { key: "overdue", label: "Overdue", count: summary.overdue, color: "#F44336" },
    { key: "inProgress", label: "In progress", count: summary.inProgress, color: "#FF9800" },
    { key: "completed", label: "Completed", count: summary.completed, color: "#4CAF50" },
  ];

  return <StatusTileCards items={items} entityName="task" />;
};

export default TaskSummaryCards;
