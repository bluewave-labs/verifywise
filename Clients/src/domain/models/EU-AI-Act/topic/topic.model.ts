export class TopicModel {
  id?: number;
  title!: string;
  order_no?: number;
  assessment_id!: number;
  is_demo?: boolean;
  created_at?: Date;

  constructor(data: TopicModel) {
    this.id = data.id;
    this.title = data.title;
    this.order_no = data.order_no;
    this.assessment_id = data.assessment_id;
    this.is_demo = data.is_demo;
    this.created_at = data.created_at;
  }

  static createTopic(data: TopicModel): TopicModel {
    return new TopicModel(data);
  }
}
