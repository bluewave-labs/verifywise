
import { apiServices } from "../../infrastructure/api/networkServices";
import { ApiResponse, User, UserNotesResponse, UserNotesUpdateRequest } from "../../domain/types/User";

export async function getUserById({
  userId,
}: {
  userId: number;
}): Promise<ApiResponse<User>> {
  const response = await apiServices.get(`/users/${userId}`);
  return  response.data;
}

export async function getAllUsers(): Promise<ApiResponse<User[]>> {
  const response = await apiServices.get(`/users`);
  return response.data;
}

export async function createNewUser({
  userData,
}: {
  userData: Omit<User, 'id' | 'created_at' | 'last_login'>;
}): Promise<ApiResponse<User>> {
  const response = await apiServices.post(`/users/register`, userData);
  return response;
}

export async function updateUserById({
  userId,
  userData,
}: {
  userId: number;
  userData: Partial<User>;
}): Promise<ApiResponse<User>> {
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

export async function updateUserNotes({
  userId,
  notes,
}: {
  userId: number;
  notes: string;
}): Promise<ApiResponse<UserNotesResponse>> {
  // Validate user ID
  if (!userId || userId <= 0) {
    throw new Error('Invalid user ID');
  }

  // Validate note content
  if (typeof notes !== 'string') {
    throw new Error('Notes must be a string');
  }

  // Validate note length (100KB limit)
  if (notes.length > 100000) {
    throw new Error('Note content exceeds maximum length (100KB)');
  }

  try {
    const response = await apiServices.patch(`/users/${userId}`, { notes });
    return response;
  } catch (error) {
    console.error("Error updating user notes:", error);
    throw error;
  }
}

export async function getUserNotes({
  userId,
}: {
  userId: number;
}): Promise<string | null> {
  // Validate user ID
  if (!userId || userId <= 0) {
    throw new Error('Invalid user ID');
  }

  try {
    const response = await apiServices.get(`/users/${userId}`);
    return response.data?.notes || null;
  } catch (error) {
    console.error("Error getting user notes:", error);
    throw error;
  }
}

