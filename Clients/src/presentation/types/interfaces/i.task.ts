/**
 * Task presentation-layer interfaces
 * Contains UI component props with callbacks
 */

import { ITask, ICreateTaskFormValues } from "../../../domain/interfaces/i.task";

// Re-export domain types for convenience
export type {
  ITask,
  ITaskAssignee,
  TaskSummary,
  TaskFilters,
  ICreateTaskFormValues,
  ICreateTaskFormErrors,
} from "../../../domain/interfaces/i.task";

/**
 * Props for create/edit task modal component
 */
export interface ICreateTaskProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSuccess?: (data: ICreateTaskFormValues) => void;
  initialData?: ITask;
  mode?: "create" | "edit";
}
