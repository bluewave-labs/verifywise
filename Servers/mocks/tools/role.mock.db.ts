import { roles } from "../role.mock.data";
import { Role } from "../../models/role.model";

export const getAllMockRoles = (): Array<any> => {
  return roles;
};

export const getMockRoleById = (id: number): object | undefined => {
  return roles.find((role: Role) => role.id === id);
};

export const createMockRole = (newRole: any): object => {
  roles.push(newRole);
  return newRole;
};

export const updateMockRoleById = (
  id: number,
  updatedRole: any
): object | null => {
  const index = roles.findIndex(
    (role: Role) => role.id === id
  );
  if (index !== -1) {
    roles[index] = { ...roles[index], ...updatedRole };
    return roles[index];
  }
  return null;
};

export const deleteMockRoleById = (id: number): object | null => {
  const index = roles.findIndex(
    (role: Role) => role.id === id
  );
  if (index !== -1) {
    const deletedRole = roles.splice(index, 1)[0];
    return deletedRole;
  }
  return null;
};
