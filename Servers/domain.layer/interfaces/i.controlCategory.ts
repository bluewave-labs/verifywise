import { IControl } from "./i.control";

export type IControlCategory = {
  id?: number; //automatically created by database
  project_id: number; // FK to the project table
  title: string; // gets assigned from the structure
  order_no?: number; // gets assigned from the structure
  controls?: IControl[];
  created_at?: Date;
};
