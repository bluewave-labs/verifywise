/**
 * Evaluation Model Preferences Service
 *
 * Manages saved model/judge preferences for experiments.
 * Preferences are stored in the database per project and auto-loaded for new experiments.
 */

import CustomAxios from "./customAxios";

export interface ModelPreferences {
  projectId: string;
  model: {
    name: string;
    accessMethod: string;
    endpointUrl?: string;
  };
  judgeLlm: {
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };
  updatedAt?: string;
}

export interface SavePreferencesRequest {
  projectId: string;
  model: {
    name: string;
    accessMethod: string;
    endpointUrl?: string;
  };
  judgeLlm: {
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };
}

interface GetPreferencesResponse {
  success: boolean;
  data: ModelPreferences | null;
}

interface SavePreferencesResponse {
  success: boolean;
  message: string;
}

interface DeletePreferencesResponse {
  success: boolean;
  message: string;
}

class EvalModelPreferencesService {
  private baseUrl = "/eval-model-preferences";

  /**
   * Get saved model preferences for a project
   */
  async getPreferences(projectId: string): Promise<ModelPreferences | null> {
    try {
      const response = await CustomAxios.get<GetPreferencesResponse>(`${this.baseUrl}/${projectId}`);
      return response.data.data;
    } catch (error) {
      console.error("Failed to fetch model preferences:", error);
      return null;
    }
  }

  /**
   * Save model preferences for a project
   */
  async savePreferences(request: SavePreferencesRequest): Promise<boolean> {
    try {
      await CustomAxios.post<SavePreferencesResponse>(this.baseUrl, request);
      return true;
    } catch (error) {
      console.error("Failed to save model preferences:", error);
      return false;
    }
  }

  /**
   * Delete saved preferences for a project
   */
  async deletePreferences(projectId: string): Promise<boolean> {
    try {
      await CustomAxios.delete<DeletePreferencesResponse>(`${this.baseUrl}/${projectId}`);
      return true;
    } catch (error) {
      console.error("Failed to delete model preferences:", error);
      return false;
    }
  }

  /**
   * Check if preferences exist for a project
   */
  async hasPreferences(projectId: string): Promise<boolean> {
    const prefs = await this.getPreferences(projectId);
    return prefs !== null;
  }
}

export const evalModelPreferencesService = new EvalModelPreferencesService();
