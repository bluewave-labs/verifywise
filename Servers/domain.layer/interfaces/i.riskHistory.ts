export interface IRiskHistory {
  id?: number;
  parameter: string; // The parameter being tracked (e.g., 'severity', 'likelihood', 'mitigation_status', 'risk_level')
  snapshot_data: Record<string, number>; // JSONB: counts of each value (e.g., {"High risk": 5, "Medium risk": 3, "Low risk": 1})
  recorded_at: Date; // When this snapshot was taken
  triggered_by_user_id?: number; // User who triggered the change (optional)
  change_description?: string; // Optional description of what changed
  created_at?: Date;
}
