/*

This is the new control category model(Schema) and will be replaced with the new one.
Please align other files with this

export type control_category = {
  id?: number; //automatically created by database
  project_id: number; // FK to the project table
  title: string; // gets assigned from the structure
  order_no: number; // gets assigned from the structure
}
*/

export type ControlCategory = {
  id?: number;
  projectId: number;
  name: string;
};
