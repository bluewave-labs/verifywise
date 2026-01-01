import { UserPreferencesModel } from "../../domain/models/Common/userPreferences/userPreferences.model";
import { apiServices } from "../../infrastructure/api/networkServices";
import { BackendResponse } from "../../domain/types/ApiTypes";

export async function getUserPreferencesByUserId(userId: number): Promise<BackendResponse<UserPreferencesModel>> {
  const response = await apiServices.get<BackendResponse<UserPreferencesModel>>(`/user-preferences/${userId}`);
  return response.data;
}

export async function createNewUserPreferences(
  data: Partial<UserPreferencesModel>
): Promise<BackendResponse<UserPreferencesModel>> {
  const response = await apiServices.post<BackendResponse<UserPreferencesModel>>(`/user-preferences/`, data);
  return response.data;
}

export async function updateUserPreferencesById({
  userId,
  data,
}: {
  userId: number;
  data: Partial<UserPreferencesModel>;
}): Promise<BackendResponse<UserPreferencesModel>> {
  const response = await apiServices.patch<BackendResponse<UserPreferencesModel>>(`/user-preferences/${userId}`, data);
  return response.data;
}
