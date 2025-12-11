interface LLMKeysData {
  id: number;
  name: string;
  key: string;
  url: string;
  model: string;
  created_at?: string;
}

export interface LLMKeysFormData {
  name: string;
  key: string;
  url: string;
  model: string;
}

export class LLMKeysModel {
  id!: number;
  name!: string;
  key!: string;
  url!: string;
  model!: string;
  created_at?: string;

  constructor(data: LLMKeysData) {
    this.id = data.id;
    this.name = data.name;
    this.key = data.key;
    this.url = data.url;
    this.model = data.model;
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