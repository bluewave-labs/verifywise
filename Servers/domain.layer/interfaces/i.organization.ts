export type IOrganization = {
  id?: number;
  name: string;
  logo?: string;
  members?: number[]; // IDs of users
  projects?: number[]; // IDs of projects
  created_at?: Date;
};
