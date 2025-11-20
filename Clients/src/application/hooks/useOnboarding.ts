import { useState, useEffect, useCallback, useContext } from "react";
import { OnboardingState, UserPreferences, SampleProjectData } from "../../domain/interfaces/i.onboarding";
import { VerifyWiseContext } from "../contexts/VerifyWise.context";
import { useAuth } from "./useAuth";

const getStorageKey = (userId: number) => `verifywise_onboarding_${userId}`;

const initialState: OnboardingState = {
  currentStep: 0,
  completedSteps: [],
  skippedSteps: [],
  preferences: {},
  sampleProject: {},
  isComplete: false,
  lastUpdated: new Date().toISOString(),
};

export const useOnboarding = () => {
  const { userId } = useAuth();
  const { users, organizationId } = useContext(VerifyWiseContext);
  const [state, setState] = useState<OnboardingState>(initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    if (!userId) return;

    const storageKey = getStorageKey(userId);
    const savedState = localStorage.getItem(storageKey);

    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setState(parsed);
      } catch (error) {
        console.error("Failed to parse onboarding state:", error);
      }
    }
  }, [userId]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!userId) return;

    const storageKey = getStorageKey(userId);
    const stateToSave = {
      ...state,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(storageKey, JSON.stringify(stateToSave));
  }, [state, userId]);

  // Check if user is first in organization
  const isFirstUserInOrg = useCallback(() => {
    if (!userId || !organizationId || !users) return false;
    // If there's only one user in the organization, they're the first user
    return users.length === 1;
  }, [userId, organizationId, users]);

  // Check if user is admin (for now, first user is admin)
  const isAdmin = useCallback(() => {
    if (!userId || !organizationId || !users) return false;
    // First user in organization is admin
    return users.length === 1;
  }, [userId, organizationId, users]);

  // Check if user was invited (not first user)
  const isInvitedUser = useCallback(() => {
    return !isFirstUserInOrg();
  }, [isFirstUserInOrg]);

  // Update current step
  const setCurrentStep = useCallback((step: number) => {
    setState((prev) => ({
      ...prev,
      currentStep: step,
    }));
  }, []);

  // Mark step as completed
  const completeStep = useCallback((step: number) => {
    setState((prev) => ({
      ...prev,
      completedSteps: [...new Set([...prev.completedSteps, step])],
    }));
  }, []);

  // Mark step as skipped
  const skipStep = useCallback((step: number) => {
    setState((prev) => ({
      ...prev,
      skippedSteps: [...new Set([...prev.skippedSteps, step])],
    }));
  }, []);

  // Update preferences
  const updatePreferences = useCallback((prefs: Partial<UserPreferences>) => {
    setState((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        ...prefs,
      },
    }));
  }, []);

  // Update sample project data
  const updateSampleProject = useCallback((data: Partial<SampleProjectData>) => {
    setState((prev) => ({
      ...prev,
      sampleProject: {
        ...prev.sampleProject,
        ...data,
      },
    }));
  }, []);

  // Complete onboarding
  const completeOnboarding = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isComplete: true,
    }));
  }, []);

  // Reset onboarding (for restart)
  const resetOnboarding = useCallback(() => {
    setState(initialState);
    if (userId) {
      const storageKey = getStorageKey(userId);
      localStorage.removeItem(storageKey);
    }
  }, [userId]);

  // Check if onboarding should be shown
  const shouldShowOnboarding = useCallback(() => {
    return !state.isComplete;
  }, [state.isComplete]);

  return {
    state,
    isFirstUserInOrg: isFirstUserInOrg(),
    isAdmin: isAdmin(),
    isInvitedUser: isInvitedUser(),
    setCurrentStep,
    completeStep,
    skipStep,
    updatePreferences,
    updateSampleProject,
    completeOnboarding,
    resetOnboarding,
    shouldShowOnboarding,
  };
};
