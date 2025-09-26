export class SubscriptionModel {
  id?: number;
  organization_id!: number;
  tier_id!: number;
  stripe_sub_id!: string;
  status!: "active" | "inactive" | "canceled";
  start_date!: Date;
  end_date?: Date;
  created_at!: Date;
  updated_at!: Date;

  constructor(data: SubscriptionModel) {
    this.id = data.id;
    this.organization_id = data.organization_id;
    this.tier_id = data.tier_id;
    this.stripe_sub_id = data.stripe_sub_id;
    this.status = data.status;
    this.start_date = data.start_date;
    this.end_date = data.end_date;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static createSubscription(data: SubscriptionModel): SubscriptionModel {
    return new SubscriptionModel(data);
  }
}
