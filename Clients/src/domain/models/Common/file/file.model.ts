export class FileModel {
  id?: number;
  filename!: string;
  content!: Buffer;
  project_id!: number;
  uploaded_by!: number;
  uploaded_time!: Date;
  source!:
    | "Assessment tracker group"
    | "Compliance tracker group"
    | "Management system clauses group"
    | "Reference controls group"
    | "Main clauses group"
    | "Annex controls group";
  type!: string;
  is_demo?: boolean;

  constructor(data: FileModel) {
    this.id = data.id;
    this.filename = data.filename;
    this.content = data.content;
    this.project_id = data.project_id;
    this.uploaded_by = data.uploaded_by;
    this.uploaded_time = data.uploaded_time;
  }

  static createNewFile(data: FileModel): FileModel {
    return new FileModel(data);
  }
}
