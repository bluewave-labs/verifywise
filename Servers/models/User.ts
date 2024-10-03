// User.ts
export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: number;
  created_at: Date;
  last_login: Date;
}
