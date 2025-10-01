export class OrganizationModel {
  id?: number;
  name!: string;
  logo!: string;
  created_at?: Date;

  constructor(data: OrganizationModel) {
    this.id = data.id;
    this.name = data.name;
    this.logo = data.logo;
    this.created_at = data.created_at;
  }

  static createNewOrganization(data: OrganizationModel): OrganizationModel {
    return new OrganizationModel(data);
  }
}
