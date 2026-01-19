/**
 * Hook for auto-populating model settings in experiment forms
 * 
 * Fetches the most recently used model from the Models table.
 * For judge LLM, uses the most recently used scorer's config if available.
 */

import { useCallback, useState, useEffect } from "react";
import { evalModelsService } from "../../infrastructure/api/evalModelsService";

export interface ModelPreferences {
  // Model being evaluated
  model: {
    name: string;
    accessMethod: string;
    endpointUrl?: string;
  };
  // Judge LLM settings (from scorer config or defaults)
  judgeLlm: {
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };
  // Timestamp of when this was saved
  savedAt?: string;
}

/**
 * Hook to get the most recently used model for auto-populating experiments
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useModelPreferences(_projectId: string) {
  const [preferences, setPreferences] = useState<ModelPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  /**
   * Load the latest model from the API
   */
  const loadPreferences = useCallback(async (): Promise<ModelPreferences | null> => {
    setLoading(true);
    try {
      // Fetch the most recently used model
      const models = await evalModelsService.listModels();

      if (models.length > 0) {
        // Models are already sorted by updated_at DESC from the API
        const latestModel = models[0];

        const prefs: ModelPreferences = {
          model: {
            name: latestModel.name,
            accessMethod: latestModel.provider,
            endpointUrl: latestModel.endpointUrl,
          },
          // Default judge settings - user can change these
          judgeLlm: {
            provider: "openai",
            model: "gpt-4o",
            temperature: 0.7,
            maxTokens: 2048,
          },
          savedAt: latestModel.updatedAt,
        };
        setPreferences(prefs);
        return prefs;
      }

      setPreferences(null);
      return null;
    } catch (err) {
      console.error("Failed to load model preferences:", err);
      setPreferences(null);
      return null;
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, []);

  /**
   * Get preferences (from cache or fetch from API)
   */
  const getPreferences = useCallback(async (): Promise<ModelPreferences | null> => {
    if (loaded) {
      return preferences;
    }
    return loadPreferences();
  }, [loaded, preferences, loadPreferences]);

  /**
   * Save model to the models table
   * Called when experiment is submitted - saves the model config for next time
   */
  const savePreferences = useCallback(async (prefs: Omit<ModelPreferences, "savedAt">): Promise<boolean> => {
    try {
      // Check if this model already exists
      const models = await evalModelsService.listModels();
      const existingModel = models.find(
        m => m.name === prefs.model.name && m.provider === prefs.model.accessMethod
      );

      if (!existingModel) {
        // Create new model entry
        const created = await evalModelsService.createModel({
          name: prefs.model.name,
          provider: prefs.model.accessMethod,
          endpointUrl: prefs.model.endpointUrl,
        });

        if (created) {
          setPreferences({
            ...prefs,
            savedAt: new Date().toISOString(),
          });
          return true;
        }
      }

      // Model already exists, just update local state
      setPreferences({
        ...prefs,
        savedAt: new Date().toISOString(),
      });
      return true;
    } catch (err) {
      console.error("Failed to save model preferences:", err);
      return false;
    }
  }, []);

  /**
   * Clear saved preferences - not implemented for this simplified version
   */
  const clearPreferences = useCallback(async (): Promise<boolean> => {
    return false;
  }, []);

  /**
   * Check if preferences exist
   */
  const hasPreferences = useCallback((): boolean => {
    return preferences !== null;
  }, [preferences]);

  // Auto-load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    preferences,
    loading,
    loaded,
    getPreferences,
    savePreferences,
    clearPreferences,
    hasPreferences,
    loadPreferences,
  };
}
