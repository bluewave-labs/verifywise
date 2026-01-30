import { CountdownInfo } from "./types";

/**
 * Calculate the number of days until a due date
 * @param dueDate - ISO date string
 * @returns Number of days until due (negative if overdue)
 */
export const getDaysUntilDue = (dueDate: string): number => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Get countdown label and variant based on days until due
 * @param daysUntilDue - Number of days until due date
 * @returns Object with label string and variant for chip styling
 */
export const getCountdownInfo = (daysUntilDue: number): CountdownInfo => {
  if (daysUntilDue < 0) {
    const overdueDays = Math.abs(daysUntilDue);
    return {
      label: overdueDays === 1 ? "1 day overdue" : `${overdueDays}d overdue`,
      variant: "error",
    };
  }
  if (daysUntilDue === 0) {
    return { label: "Due today", variant: "warning" };
  }
  if (daysUntilDue === 1) {
    return { label: "Tomorrow", variant: "warning" };
  }
  if (daysUntilDue <= 7) {
    return { label: `${daysUntilDue}d left`, variant: "info" };
  }
  return { label: `${daysUntilDue}d left`, variant: "default" };
};

/**
 * Get start of current week (Monday)
 * @param date - Reference date
 * @returns Date object set to start of week (Monday 00:00:00)
 */
export const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get end of current week (Sunday)
 * @param date - Reference date
 * @returns Date object set to end of week (Sunday 23:59:59)
 */
export const getEndOfWeek = (date: Date): Date => {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

/**
 * Get end of current month
 * @param date - Reference date
 * @returns Date object set to last day of month (23:59:59)
 */
export const getEndOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
};
