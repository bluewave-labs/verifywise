export class SubtopicModel {
  id?: number;
  title!: string;
  order_no?: number;
  topic_id!: number;
  is_demo?: boolean;
  created_at?: Date;

  constructor(data: SubtopicModel) {
    this.id = data.id;
    this.title = data.title;
    this.order_no = data.order_no;
    this.topic_id = data.topic_id;
    this.is_demo = data.is_demo;
    this.created_at = data.created_at;
  }

  static createSubtopic(data: SubtopicModel): SubtopicModel {
    return new SubtopicModel(data);
  }
}
