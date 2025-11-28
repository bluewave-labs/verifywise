interface LLMKeysData {
  id: number;
  name: string;
  key: string;
  created_at?: string;
}

export class LLMKeysModel {
  id!: number;
  name!: string;
  key!: string;
  created_at?: string;

  constructor(data: LLMKeysData) {
    this.id = data.id;
    this.name = data.name;
    this.key = data.key;
    this.created_at = data.created_at;
  }

  static createNewKey(data: LLMKeysModel): LLMKeysModel {
    return new LLMKeysModel(data);
  }

  getFormattedCreatedDate(): string {
    return new Date(this.created_at ?? "").toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
}