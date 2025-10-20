import { apiServices } from "../../infrastructure/api/networkServices";
import { ApiResponse, User } from "../../domain/types/User";

export async function getUserById({
  userId,
}: {
  userId: number;
}): Promise<ApiResponse<User>> {
  const response = await apiServices.get(`/users/${userId}`);
  return response.data as ApiResponse<User>;
}

export async function getAllUsers(): Promise<ApiResponse<User[]>> {
  const response = await apiServices.get(`/users`);
  return response.data as ApiResponse<User[]>;
}

export async function createNewUser({
  userData,
}: {
  userData: any;
}): Promise<ApiResponse<User>> {
  try {
    const response = await apiServices.post(`/users/register`, userData);
    return response as ApiResponse<User>;
  } catch (error: any) {
    // Re-throw the error with the response data intact
    if (error.response) {
      throw {
        ...error,
        status: error.response.status,
        data: error.response.data,
      };
    }
    throw error;
  }
}

export async function updateUserById({
  userId,
  userData,
}: {
  userId: number;
  userData: any;
}): Promise<ApiResponse<User>> {
  const response = await apiServices.patch(`/users/${userId}`, userData);
  return response as ApiResponse<User>;
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
  const response = await apiServices.patch(`/users/chng-pass/${userId}`, {
    id: userId,
    currentPassword,
    newPassword,
  });
  return response;
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

export async function loginUser({ body }: { body: any }): Promise<any> {
  try {
    const response = await apiServices.post(`/users/login`, body);
    return response;
  } catch (error) {
    console.error("Error logging in user:", error);
    throw error;
  }
}

export async function uploadUserProfilePhoto(
  userId: number,
  photoFile: File,
): Promise<any> {
  try {
    const formData = new FormData();
    formData.append("photo", photoFile);

    const response = await apiServices.post(
      `/users/${userId}/profile-photo`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response;
  } catch (error) {
    console.error("Error uploading profile photo:", error);
    throw error;
  }
}

export async function getUserProfilePhoto(userId: number): Promise<any> {
  const response = await apiServices.get(`/users/${userId}/profile-photo`, {
    responseType: "json",
  });
  return response.data;
}

/**
 * Deletes a user's profile photo.
 *
 * @param {number} userId - The ID of the user.
 * @returns {Promise<any>} The response from the API.
 */
export async function deleteUserProfilePhoto(userId: number): Promise<any> {
  try {
    const response = await apiServices.delete(`/users/${userId}/profile-photo`);
    return response;
  } catch (error) {
    console.error("Error deleting profile photo:", error);
    throw error;
  }
}
