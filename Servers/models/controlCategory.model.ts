import { Control } from "./control.model";

/*

This is the new ControlCategory model(Schema) and will be replaced with the new one.
Please align other files with this

*/
export type ControlCategory = {
  id?: number; //automatically created by database
  project_id: number; // FK to the project table
  title: string; // gets assigned from the structure
  order_no?: number; // gets assigned from the structure
  controls?: Control[];
};

// export type ControlCategory = {
//   id?: number;
//   projectId: number;
//   name: string;
//   orderNo: number;
// };
