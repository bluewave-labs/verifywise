import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../../application/hooks/useAuth";
import { useOnboarding } from "../Onboarding";
import { STORAGE_KEY, STORAGE_KEY_PREFIX } from "./releaseConfig";

/**
 * Clean up localStorage keys from previous release videos.
 * Only the current version's key is relevant — old ones are removed.
 */
function cleanUpOldReleaseKeys() {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEY_PREFIX) && key !== STORAGE_KEY) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

export function useWhatsNewVideo() {
  const { token, userId } = useAuth();
  const location = useLocation();
  const { state } = useOnboarding();
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    cleanUpOldReleaseKeys();
  }, []);

  useEffect(() => {
    const isDashboard = location.pathname === "/";
    const isAuthenticated = Boolean(token && userId);
    const onboardingComplete = state.isComplete === true;

    const orgNameModalDone =
      localStorage.getItem("has_seen_org_name_modal") !== null ||
      localStorage.getItem("initial_org_name") === null;

    const alreadySeen = localStorage.getItem(STORAGE_KEY) === "true";

    setShowVideo(
      isAuthenticated &&
        isDashboard &&
        onboardingComplete &&
        orgNameModalDone &&
        !alreadySeen
    );
  }, [token, userId, location.pathname, state.isComplete]);

  const dismissVideo = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setShowVideo(false);
  };

  return { showVideo, dismissVideo };
}
