export interface Event {
  id: number;
  event_type: "Create" | "Read" | "Update" | "Delete" | "Error";
  description: string;
  user_id: number;
  timestamp: string;
}

export type EventType = Event["event_type"];
