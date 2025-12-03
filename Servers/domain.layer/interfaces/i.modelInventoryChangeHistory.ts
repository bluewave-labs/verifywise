export interface IModelInventoryChangeHistory {
  id?: number;
  model_inventory_id: number;
  action: "created" | "updated" | "deleted";
  field_name?: string;
  old_value?: string;
  new_value?: string;
  changed_by_user_id: number;
  changed_at?: Date;
  created_at?: Date;
}
