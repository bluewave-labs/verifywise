import { Control } from "./Control";

export type ControlCategory = {
  id?: number; //automatically created by database
  project_id: number; // FK to the project table
  title: string; // gets assigned from the structure
  order_no?: number; // gets assigned from the structure
  controls?: Control[];
};
