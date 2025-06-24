export interface IUser {
  id: number;
  name: string;
  surname: string;
  email: string;
  password_hash: string;
  role_id: number;
  created_at: Date;
  last_login: Date;
  is_demo?: boolean;
}
