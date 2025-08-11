import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/auth/getAuthToken";

export async function getTrainingById({
  trainingId,
  authToken = getAuthToken(),
}: {
  trainingId: number;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.get(`/trainings/${trainingId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response.data
}

export async function getTrainingDetails({
  trainingId,
  authToken = getAuthToken(),
}: {
  trainingId: number;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.get(`/training/training-id/${trainingId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response.data
}

export async function getAllTrainings({
  authToken = getAuthToken(),
}: {
  authToken?: string;
} = {}): Promise<any> {
  const response = await apiServices.get(`/trainings`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response.data
}

export async function createTraining({
  trainingData,
  authToken = getAuthToken(),
}: {
  trainingData: any;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.post(`/trainings`, trainingData, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return  response
}

export async function updateTrainingById({
  trainingId,
  trainingData,
  authToken = getAuthToken(),
}: {
  trainingId: number;
  trainingData: any;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.put(`/trainings/${trainingId}`, trainingData, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}

export async function deleteTrainingById({
  trainingId,
  authToken = getAuthToken(),
}: {
  trainingId: number;
  authToken?: string;
}): Promise<any> {
  const response = await apiServices.delete(`/trainings/${trainingId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return response;
}
