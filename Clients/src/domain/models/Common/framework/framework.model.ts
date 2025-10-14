export class FrameworkModel {
  id?: number;
  name!: string;
  description!: string;
  created_at!: Date;
  is_organizational!: boolean;

  constructor(data: FrameworkModel) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.created_at = data.created_at;
    this.is_organizational = data.is_organizational;
  }

  static createNewFramework(data: FrameworkModel): FrameworkModel {
    return new FrameworkModel(data);
  }
}
