export class LLMKeysModel {
  id!: number;
  name!: string;
  key!: string;
  created_at?: string;

  constructor(data: LLMKeysModel) {
    this.id = data.id;
    this.name = data.name;
    this.key = data.key;
  }
}