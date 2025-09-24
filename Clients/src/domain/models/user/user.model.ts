export class UserModel {
  id?: number;
  name: string;
  surname: string;
  email: string;
  password_hash?: string;
  roleId?: number;
  created_at?: Date;
  last_login?: Date;

  constructor(data: UserModel) {
    this.id = data.id;
    this.name = data.name;
    this.surname = data.surname;
    this.email = data.email;
    this.password_hash = data.password_hash;
    this.roleId = data.roleId;
    this.created_at = data.created_at;
    this.last_login = data.last_login;
  }

  static createNewUser(data: UserModel): UserModel {
    return new UserModel(data);
  }
}
