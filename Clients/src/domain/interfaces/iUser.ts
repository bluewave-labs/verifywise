export interface IUser {
  id?: number;
  name: string;
  surname: string;
  email: string;
  password_hash?: string;
  roleId?: number;
  created_at?: Date;
  last_login?: Date;
}
