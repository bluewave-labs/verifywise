import { TrainingStatus } from "../../../enums/status.enum";

/**
 * TrainingRegistarModel - Client-side model for training registry
 *
 * ARCHITECTURE DECISION: Uses 'numberOfPeople' to match API contract
 * - API expects: numberOfPeople
 * - Server model property: numberOfPeople
 * - Database column: 'people' (mapped by ORM on server side)
 *
 * This ensures consistency across client-server communication.
 */
export class TrainingRegistarModel {
  id?: number;
  training_name!: string;
  duration!: string;
  provider!: string;
  department!: string;
  status!: TrainingStatus;
  numberOfPeople!: number;
  description!: string;

  constructor(data: Partial<TrainingRegistarModel>) {
    this.id = data.id;
    this.training_name = data.training_name!;
    this.duration = data.duration!;
    this.provider = data.provider!;
    this.department = data.department!;
    this.status = data.status!;
    this.numberOfPeople = data.numberOfPeople ?? 0;
    this.description = data.description ?? "";
  }

  static createTrainingRegistar(
    data: Partial<TrainingRegistarModel>
  ): TrainingRegistarModel {
    return new TrainingRegistarModel(data);
  }
}
