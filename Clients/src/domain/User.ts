export type User = {
  id: number;
  name: string;
  surname: string;
  email: string;
  password_hash: string;
  role: number;
  created_at: Date;
  last_login: Date;
};
