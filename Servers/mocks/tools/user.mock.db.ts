import { users } from "../users/users.data";

export const getAllMockUsers = () => {
  return users;
};

export const getMockUserByEmail = (email: string) => {
  return users.find((user) => user.email === email);
};

export const getMockUserById = (id: number) => {
  return users.find((user) => user.id === id);
};

export const createMockUser = (user: any) => {
  const isEmailUnique = !users.some(
    (existingUser) => existingUser.email === user.email
  );
  const isIdUnique = !users.some((existingUser) => existingUser.id === user.id);

  if (isEmailUnique && isIdUnique) {
    users.push(user);
    return user;
  } else {
    throw new Error("User with this email or id already exists.");
  }
};

export const resetMockPassword = (email: string, newPassword: string) => {
  const user = users.find((user) => user.email === email);
  if (user) {
    user.password_hash = newPassword;
  }
  return user;
};

export const updateMockUserById = (id: number, user: any) => {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) {
    users[index] = { ...users[index], ...user };
    return users[index];
  }
  return null;
};

export const deleteMockUserById = (id: number) => {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
  return null;
};
