export type EventType = "Create" | "Read" | "Update" | "Delete" | "Error";

export class EventModel {
  id!: number;
  event_type!: EventType;
  description!: string;
  user_id!: number;
  timestamp!: string;

  constructor(data: EventModel) {
    this.id = data.id;
    this.event_type = data.event_type;
    this.description = data.description;
    this.user_id = data.user_id;
    this.timestamp = data.timestamp;
  }

  static createNewEvent(data: EventModel): EventModel {
    return new EventModel(data);
  }
}
