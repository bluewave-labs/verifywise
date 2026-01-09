export interface IModelInventoryHistory {
  id?: number;
  parameter: string; // The parameter being tracked (e.g., 'status', 'security_assessment')
  snapshot_data: Record<string, number>; // JSONB: counts of each value (e.g., {"Approved": 5, "Pending": 3, "Restricted": 1, "Blocked": 0})
  recorded_at: Date; // When this snapshot was taken
  triggered_by_user_id?: number; // User who triggered the change (optional)
  change_description?: string; // Optional description of what changed
  created_at?: Date;
}
