/**
 * Hook for managing saved model and judge preferences for experiments
 * 
 * Stores preferences in the database per project, allowing:
 * - Auto-population of model/judge settings in new experiments
 * - Persistence across browser sessions and devices
 */

import { useCallback, useState, useEffect } from "react";
import { evalModelPreferencesService } from "../../infrastructure/api/evalModelPreferencesService";

export interface ModelPreferences {
  // Model being evaluated
  model: {
    name: string;
    accessMethod: string;
    endpointUrl?: string;
  };
  // Judge LLM settings
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
 * Hook to manage model preferences for experiments
 */
export function useModelPreferences(projectId: string) {
  const [preferences, setPreferences] = useState<ModelPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  /**
   * Load preferences from the API
   */
  const loadPreferences = useCallback(async (): Promise<ModelPreferences | null> => {
    if (!projectId) return null;
    
    setLoading(true);
    try {
      const apiPrefs = await evalModelPreferencesService.getPreferences(projectId);
      if (apiPrefs) {
        const prefs: ModelPreferences = {
          model: apiPrefs.model,
          judgeLlm: apiPrefs.judgeLlm,
          savedAt: apiPrefs.updatedAt,
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
  }, [projectId]);

  /**
   * Get preferences (from cache or fetch from API)
   */
  const getPreferences = useCallback(async (): Promise<ModelPreferences | null> => {
    // If already loaded, return cached preferences
    if (loaded) {
      return preferences;
    }
    // Otherwise fetch from API
    return loadPreferences();
  }, [loaded, preferences, loadPreferences]);

  /**
   * Save preferences to the API
   */
  const savePreferences = useCallback(async (prefs: Omit<ModelPreferences, "savedAt">): Promise<boolean> => {
    if (!projectId) return false;
    
    try {
      const success = await evalModelPreferencesService.savePreferences({
        projectId,
        model: prefs.model,
        judgeLlm: prefs.judgeLlm,
      });
      
      if (success) {
        // Update local cache
        setPreferences({
          ...prefs,
          savedAt: new Date().toISOString(),
        });
      }
      return success;
    } catch (err) {
      console.error("Failed to save model preferences:", err);
      return false;
    }
  }, [projectId]);

  /**
   * Clear saved preferences
   */
  const clearPreferences = useCallback(async (): Promise<boolean> => {
    if (!projectId) return false;
    
    try {
      const success = await evalModelPreferencesService.deletePreferences(projectId);
      if (success) {
        setPreferences(null);
      }
      return success;
    } catch (err) {
      console.error("Failed to clear model preferences:", err);
      return false;
    }
  }, [projectId]);

  /**
   * Check if preferences exist
   */
  const hasPreferences = useCallback((): boolean => {
    return preferences !== null;
  }, [preferences]);

  // Auto-load preferences when projectId changes
  useEffect(() => {
    if (projectId) {
      setLoaded(false);
      loadPreferences();
    }
  }, [projectId, loadPreferences]);

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
