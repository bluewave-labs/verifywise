export interface TierFeatures {
  seats: number;
  projects: number;
  frameworks: number;
}

export class TierModel {
  id?: number;
  name!: string;
  price!: number;
  features!: TierFeatures;
  created_at!: Date;
  updated_at!: Date;

  constructor(data: TierModel) {
    this.id = data.id;
    this.name = data.name;
    this.price = data.price;
    this.features = data.features;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static createTier(data: TierModel): TierModel {
    return new TierModel(data);
  }
}
