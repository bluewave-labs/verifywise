
import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/auth/getAuthToken";

export async function getUserById({
  userId,
  authToken = getAuthToken(),
}: {
  userId: number;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.get(`/users/${userId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response.data;
}

export async function getAllUsers({
  authToken = getAuthToken(),
}: {
  authToken?: string;
} = {}): Promise<any> {
  const response = await apiServices.get(`/users`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response.data;
}

export async function createNewUser({
  userData,
  authToken = getAuthToken(),
}: {
  userData: any;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.post(`/users/register`, userData, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}

export async function updateUserById({
  userId,
  userData,
  authToken = getAuthToken(),
}: {
  userId: number;
  userData: any;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.put(`/users/${userId}`, userData, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}

export async function updatePassword({
  userId,
  currentPassword,
  newPassword,
  authToken = getAuthToken(),
}: {
  userId: number;
  currentPassword: string;
  newPassword: string;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.patch(
    `/users/chng-pass/${userId}`,
    { id: userId, currentPassword, newPassword },
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );
  return response;
}

export async function deleteUserById({
  userId,
  authToken = getAuthToken(),
}: {
  userId: number;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.delete(`/users/${userId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}


export async function checkUserExists({
  authToken = getAuthToken(),
}: {
  authToken?: string;
}): Promise<any> {
  try {
    const response = await apiServices.get(`/users/check/exists`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
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
  authToken = getAuthToken(),
}: {
  googleToken: string;
  userData: any;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.post(`/users/register-google`, {
    token: googleToken, userData
  }, {
    headers: { Authorization: `Bearer ${authToken}` },
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

