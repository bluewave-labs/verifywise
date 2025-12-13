import { useState, useEffect } from "react";
import { UserPreferencesModel } from '../../domain/models/Common/UserPreferences/userPreferences.model';
import { getUserPreferencesByUserId } from "../repository/userPreferences.repository";
import { useAuth } from "./useAuth";
import { UserDateFormat } from "../../domain/enums/userDateFormat.enum";

const defaultUserPreferences: Omit<UserPreferencesModel, "id" | "user_id"> = {
  date_format: UserDateFormat.DD_MM_YYYY_DASH,
};

const useUserPreferences = () => {
  const { userId } = useAuth();
  const [userPreferences, setUserPreferences] = useState<
    Omit<UserPreferencesModel, "id" | "user_id">
  >(defaultUserPreferences);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDefault, setIsDefault] = useState<boolean>(false);

  const fetchUserPreferences = async () => {
    try {
      setLoading(true);
      const response = await getUserPreferencesByUserId(userId!);

      setUserPreferences(response.data);
      setError(null);
      setIsDefault(false);
    } catch (err) {
      setIsDefault(true);
      setError(
        err instanceof Error ? err.message : "Failed to fetch user preferences",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserPreferences();
    }
  }, [userId]);

  return {
    userPreferences,
    isDefault,
    loading,
    error,
    refreshUserPreferences: fetchUserPreferences,
  };
};

export default useUserPreferences;
