export interface IAutomation {
  id?: number;
  name: string;
  trigger_id?: number;
  params?: object;
  is_active?: boolean;
  created_by?: number;
  created_at?: Date;
}
