import { TrainingStatus } from "../../../enums/status.enum";

export class TrainingRegistarModel {
  id?: number;
  training_name!: string;
  duration!: string;
  provider!: string;
  department!: string;
  status!: TrainingStatus;
  people!: number;
  description!: string;

  constructor(data: Partial<TrainingRegistarModel> & { numberOfPeople?: number }) {
    this.id = data.id;
    this.training_name = data.training_name!;
    this.duration = data.duration!;
    this.provider = data.provider!;
    this.department = data.department!;
    this.status = data.status!;
    // Handle both 'people' and 'numberOfPeople' for backward compatibility
    this.people = data.people ?? data.numberOfPeople ?? 0;
    this.description = data.description ?? "";
  }

  static createTrainingRegistar(
    data: Partial<TrainingRegistarModel> & { numberOfPeople?: number }
  ): TrainingRegistarModel {
    return new TrainingRegistarModel(data);
  }

  // Getter for backward compatibility with forms using 'numberOfPeople'
  get numberOfPeople(): number {
    return this.people;
  }

  // Setter for backward compatibility with forms using 'numberOfPeople'
  set numberOfPeople(value: number) {
    this.people = value;
  }
}
