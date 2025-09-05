
import CustomAxios from "../../infrastructure/api/customAxios";
import { apiServices } from "../../infrastructure/api/networkServices";

export async function getUserById({
  userId,
}: {
  userId: number;
}): Promise<any> {
  const response = await apiServices.get(`/users/${userId}`);
  return response.data;
}

export async function getAllUsers(): Promise<any> {
  const response = await apiServices.get(`/users`);
  return response.data;
}

export async function createNewUser({
  userData,
}: {
  userData: any;
}): Promise<any> {
  const response = await apiServices.post(`/users/register`, userData);
  return response;
}

export async function updateUserById({
  userId,
  userData,
}: {
  userId: number;
  userData: any;
}): Promise<any> {
  const response = await apiServices.put(`/users/${userId}`, userData);
  return response;
}

export async function updatePassword({
  userId,
  currentPassword,
  newPassword,
}: {
  userId: number;
  currentPassword: string;
  newPassword: string;
}): Promise<any> {
  const response = await CustomAxios.patch(
    `/users/chng-pass/${userId}`,
    { id: userId, currentPassword, newPassword }
  );
  return {
    status: response.status,
    data: response.data,
  };
}

export async function deleteUserById({
  userId,
}: {
  userId: number;
}): Promise<any> {
  const response = await apiServices.delete(`/users/${userId}`);
  return response;
}


export async function checkUserExists(): Promise<any> {
  try {
    const response = await apiServices.get(`/users/check/exists`);
    return response.data;
  } catch (error) {
    console.error("Error checking if user exists:", error);
    throw error;
  }
}

export async function loginUser({
  body,
}: {
  body: any;
}): Promise<any> {
  try {
    const response = await apiServices.post(`/users/login`, body);
    return response;
  } catch (error) {
    console.error("Error logging in user:", error);
    throw error;
  }
}

export async function createNewUserWithGoogle({
  googleToken,
  userData,
}: {
  googleToken: string;
  userData: any;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.post(`/users/register-google`, {
    token: googleToken, userData
  });
  return response;
}

export async function loginWithGoogle({
  googleToken,
}: {
  googleToken: string;
}): Promise<any> {
  try {
    const response = await apiServices.post(`/users/login-google`, {
      token: googleToken
    });
    return response;
  } catch (error) {
    console.error("Error logging in with Google:", error);
    throw error;
  }
}

