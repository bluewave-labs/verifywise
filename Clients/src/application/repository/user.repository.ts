
import { apiServices } from "../../infrastructure/api/networkServices";
import { ApiResponse, User } from "../../domain/types/User";

/**
 * User data for creating a new user
 * Note: API expects snake_case (role_id) but we also accept roleId for flexibility
 */
interface CreateUserData {
  name: string;
  surname: string;
  email: string;
  password: string;
  roleId?: number;
  role_id?: number;
  organizationId?: number;
  organization_id?: number;
}

/**
 * User data for updating an existing user
 */
interface UpdateUserData {
  name?: string;
  surname?: string;
  email?: string;
  roleId?: number;
  organizationId?: number;
}

/**
 * Login credentials
 */
interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Response from password change endpoint
 */
interface PasswordChangeResponse {
  message: string;
}

/**
 * Response from delete endpoint
 */
interface DeleteResponse {
  message: string;
}

/**
 * Response from check user exists endpoint
 */
interface UserExistsResponse {
  exists: boolean;
}

/**
 * Response from profile photo upload
 */
interface ProfilePhotoResponse {
  photoUrl?: string;
  message?: string;
}

export async function getUserById({
  userId,
}: {
  userId: number | string | undefined;
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
  userData: CreateUserData;
}): Promise<ApiResponse<User>> {
  try {
    const response = await apiServices.post(`/users/register`, userData);
    return response as ApiResponse<User>;
  } catch (error: unknown) {
    // Re-throw the error with the response data intact
    const axiosError = error as { response?: { status: number; data: unknown } };
    if (axiosError.response) {
      const errorObj = error as Record<string, unknown>;
      throw {
        ...errorObj,
        status: axiosError.response.status,
        data: axiosError.response.data,
      };
    }
    throw error;
  }
}

export async function updateUserById({
  userId,
  userData,
}: {
  userId: number | string;
  userData: UpdateUserData;
}): Promise<ApiResponse<User>> {
  const response = await apiServices.patch(`/users/${userId}`, userData);
  return response as ApiResponse<User>;
}

export async function updatePassword({
  userId,
  currentPassword,
  newPassword,
}: {
  userId: number | string;
  currentPassword: string;
  newPassword: string;
}): Promise<ApiResponse<PasswordChangeResponse>> {
  const response = await apiServices.patch(`/users/chng-pass/${userId}`, {
    id: userId,
    currentPassword,
    newPassword,
  });
  return response as ApiResponse<PasswordChangeResponse>;
}

export async function deleteUserById({
  userId,
}: {
  userId: number | string;
}): Promise<ApiResponse<DeleteResponse>> {
  const response = await apiServices.delete(`/users/${userId}`);
  return response as ApiResponse<DeleteResponse>;
}

export async function checkUserExists(): Promise<UserExistsResponse> {
  const response = await apiServices.get<UserExistsResponse>(`/users/check/exists`);
  return response.data;
}

/**
 * Login response with nested data structure
 */
interface LoginResponse {
  data: {
    token: string;
  };
}

export async function loginUser({ body }: { body: LoginCredentials }): Promise<ApiResponse<LoginResponse>> {
  const response = await apiServices.post<LoginResponse>(`/users/login`, body);
  return response;
}

export async function uploadUserProfilePhoto(
  userId: number | string,
  photoFile: File,
): Promise<ApiResponse<ProfilePhotoResponse>> {
  const formData = new FormData();
  formData.append("photo", photoFile);

  const response = await apiServices.post<ProfilePhotoResponse>(
    `/users/${userId}/profile-photo`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response;
}

export async function getUserProfilePhoto(userId: number | string): Promise<ProfilePhotoResponse> {
  const response = await apiServices.get<ProfilePhotoResponse>(`/users/${userId}/profile-photo`, {
    responseType: "json",
  });
  return response.data;
}

/**
 * Deletes a user's profile photo.
 *
 * @param {number | string} userId - The ID of the user.
 * @returns {Promise<ApiResponse<DeleteResponse>>} The response from the API.
 */
export async function deleteUserProfilePhoto(userId: number | string): Promise<ApiResponse<DeleteResponse>> {
  const response = await apiServices.delete<DeleteResponse>(`/users/${userId}/profile-photo`);
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
