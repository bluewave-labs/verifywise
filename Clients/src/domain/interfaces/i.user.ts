export interface CreateProjectFormUser {
  _id: number;
  name: string;
  surname: string;
  email: string;
}

export interface IUser {
  id: number;
  name: string;
  surname: string;
  email: string;
  password_hash?: string;
  role_id?: number;
  roleId?: number;
  created_at?: Date;
  last_login?: Date;
  is_demo?: boolean;
  organization_id?: number;
  pwd_set?: boolean;
  data?: any;
}
