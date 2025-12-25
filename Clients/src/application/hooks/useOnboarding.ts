import { useState, useEffect, useCallback, useContext } from "react";
import { OnboardingState, UserPreferences, SampleProjectData } from "../../presentation/types/interfaces/i.onboarding";
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
  const [isLoading, setIsLoading] = useState(true);

  // Load state from localStorage on mount
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const storageKey = getStorageKey(userId);
    const savedState = localStorage.getItem(storageKey);

    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setState(parsed);
      } catch (error) {
        console.error("Failed to parse onboarding state:", error);
        // If parse fails, mark as complete to prevent showing broken state
        setState({ ...initialState, isComplete: true });
      }
    } else {
      // First time for this user - initialize with default state
      setState(initialState);
    }
    setIsLoading(false);
  }, [userId]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!userId) return;

    const storageKey = getStorageKey(userId);
    localStorage.setItem(storageKey, JSON.stringify(state));

    // Note: We removed cross-tab sync to prevent infinite loops
    // If cross-tab sync is needed, it should use the native storage event instead
  }, [state, userId]);

  // Listen for native storage events from other tabs
  useEffect(() => {
    if (!userId) return;

    const handleStorageChange = (event: StorageEvent) => {
      const storageKey = getStorageKey(userId);

      // Only handle changes to our specific key
      if (event.key !== storageKey) return;

      // Only handle changes from other tabs (event.storageArea will be null for same tab)
      if (!event.newValue) return;

      try {
        const newState = JSON.parse(event.newValue);
        setState((currentState) => {
          // Only update if the state actually changed
          if (newState.lastUpdated !== currentState.lastUpdated) {
            return newState;
          }
          return currentState;
        });
      } catch (error) {
        console.error('Failed to parse storage event:', error);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [userId]);

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
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  // Mark step as completed
  const completeStep = useCallback((step: number) => {
    setState((prev) => ({
      ...prev,
      completedSteps: [...new Set([...prev.completedSteps, step])],
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  // Mark step as skipped
  const skipStep = useCallback((step: number) => {
    setState((prev) => ({
      ...prev,
      skippedSteps: [...new Set([...prev.skippedSteps, step])],
      lastUpdated: new Date().toISOString(),
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
      lastUpdated: new Date().toISOString(),
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
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  // Complete onboarding
  const completeOnboarding = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isComplete: true,
      lastUpdated: new Date().toISOString(),
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
    if (!userId || isLoading) return false;

    // Simply check if onboarding is complete in state
    // No session storage needed - localStorage persistence handles everything
    return !state.isComplete;
  }, [state.isComplete, userId, isLoading]);

  return {
    state,
    isLoading,
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
