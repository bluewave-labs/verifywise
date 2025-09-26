export class TrainingRegistarModel {
  id?: number;
  training_name!: string;
  duration!: string;
  provider!: string;
  department!: string;
  status!: "Planned" | "In Progress" | "Completed";
  numberOfPeople!: number;
  description!: string;

  constructor(data: TrainingRegistarModel) {
    this.id = data.id;
    this.training_name = data.training_name;
    this.duration = data.duration;
    this.provider = data.provider;
    this.department = data.department;
    this.status = data.status;
    this.numberOfPeople = data.numberOfPeople;
    this.description = data.description;
  }

  static createTrainingRegistar(
    data: TrainingRegistarModel
  ): TrainingRegistarModel {
    return new TrainingRegistarModel(data);
  }
}
