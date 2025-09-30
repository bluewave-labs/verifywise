export class TierFeatureModel {
  seats: number;
  projects: number;
  frameworks: number;

  constructor(data: TierFeatureModel) {
    this.seats = data.seats;
    this.projects = data.projects;
    this.frameworks = data.frameworks;
  }

  static createTierFeature(data: TierFeatureModel): TierFeatureModel {
    return new TierFeatureModel(data);
  }
}
