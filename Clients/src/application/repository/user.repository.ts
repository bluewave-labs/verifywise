
import { apiServices } from "../../infrastructure/api/networkServices";
import { User, ApiResponse } from "../../domain/types/User";

export async function getUserById({
  userId,
}: {
  userId: number;
}): Promise<any> {
  const response = await apiServices.get(`/users/${userId}`);
  return  response.data;
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
  const response = await apiServices.patch(`/users/${userId}`, userData);
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
}): Promise<ApiResponse<{ message: string }>> {
  const response = await apiServices.patch(
    `/users/chng-pass/${userId}`,
    { id: userId, currentPassword, newPassword }
  );
  return response;
}

export async function deleteUserById({
  userId,
}: {
  userId: number;
}): Promise<ApiResponse<{ message: string }>> {
  const response = await apiServices.delete(`/users/${userId}`);
  return response;
}


export async function checkUserExists(): Promise<ApiResponse<{ exists: boolean }>> {
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
    body: { email: string; password: string };
  }): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const response = await apiServices.post(`/users/login`, body);
      return response;
    } catch (error) {
      console.error("Error logging in user:", error);
      throw error;
    }
  }


