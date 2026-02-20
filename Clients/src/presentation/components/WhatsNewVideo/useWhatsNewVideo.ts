import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../../application/hooks/useAuth";
import { useOnboarding } from "../Onboarding";

const RELEASE_VERSION = "2.1";
const STORAGE_KEY = `seen_release_video_${RELEASE_VERSION}`;

export function useWhatsNewVideo() {
  const { token, userId } = useAuth();
  const location = useLocation();
  const { state } = useOnboarding();
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const isDashboard = location.pathname === "/";
    const isAuthenticated = Boolean(token && userId);
    const onboardingComplete = state.isComplete === true;

    // Check if org name modal is done
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
