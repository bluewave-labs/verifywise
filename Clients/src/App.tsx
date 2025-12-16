import { Routes } from "react-router-dom";
import "./App.css";
import { ThemeProvider } from "@emotion/react";
import light from "./presentation/themes/light";
import { CssBaseline } from "@mui/material";
import { VerifyWiseContext } from "./application/contexts/VerifyWise.context";
import { useCallback, useMemo, useState, useEffect } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./application/redux/store";
import useProjectStatus from "./application/hooks/useProjectStatus";
import { useAuth } from "./application/hooks/useAuth";
import { Project } from "./domain/types/Project";
import { CookiesProvider } from "react-cookie";
import { createRoutes } from "./application/config/routes";
import { DashboardState, UIValues, AuthValues, InputValues } from "./application/interfaces/appStates";
import { ComponentVisible } from "./application/interfaces/ComponentVisible";
import { AlertProps } from "./domain/interfaces/i.alert";
import { setShowAlertCallback } from "./infrastructure/api/customAxios";
import Alert from "./presentation/components/Alert";
import useUsers from "./application/hooks/useUsers";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useLocation } from "react-router-dom";
import { DeploymentManager } from "./application/utils/deploymentHelpers";
import CommandPalette from "./presentation/components/CommandPalette";
import CommandPaletteErrorBoundary from "./presentation/components/CommandPalette/ErrorBoundary";
import useCommandPalette from "./application/hooks/useCommandPalette";
import useUserPreferences from "./application/hooks/useUserPreferences";
import { OnboardingModal, useOnboarding } from "./presentation/components/Onboarding";
import { SidebarWrapper, UserGuideSidebarProvider, useUserGuideSidebarContext } from "./presentation/components/UserGuide";

// Auth routes where the helper sidebar should not be shown
const AUTH_ROUTES = [
  '/login',
  '/admin-reg',
  '/user-reg',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/set-new-password',
  '/reset-password-continue',
];

// Component for User Guide Sidebar that uses the context
const UserGuideSidebarContainer = () => {
  const location = useLocation();
  const userGuideSidebar = useUserGuideSidebarContext();

  // Don't show the helper sidebar on auth pages
  const isAuthPage = AUTH_ROUTES.some(route => location.pathname === route);
  if (isAuthPage) {
    return null;
  }

  return (
    <SidebarWrapper
      isOpen={userGuideSidebar.isOpen}
      onClose={userGuideSidebar.close}
      onOpen={userGuideSidebar.open}
      initialPath={userGuideSidebar.currentPath}
    />
  );
};

// Component to conditionally apply theme based on route
const ConditionalThemeWrapper = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isAITrustCentreRoute = location.pathname.includes('/aiTrustCentre');

  // For aiTrustCentre routes, don't apply theme (like /public route)
  if (isAITrustCentreRoute) {
    return (
      <>
        <CssBaseline />
        {children}
      </>
    );
  }

  // For other routes, apply light theme
  return (
    <ThemeProvider theme={light}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

function App() {
  const location = useLocation();
  const { token, userRoleName, organizationId, userId } = useAuth();
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const { users, refreshUsers } = useUsers();
  const {userPreferences} = useUserPreferences();
  const commandPalette = useCommandPalette();
  const { completeOnboarding, state, isLoading: isOnboardingLoading } = useOnboarding();
  const [showModal, setShowModal] = useState(false);

  // Onboarding should ONLY show on the dashboard (/) route
  const isDashboardRoute = location.pathname === '/';

  // Update modal visibility based on onboarding state and current route
  useEffect(() => {
    // Only show modal if:
    // 1. User is authenticated (has token and userId)
    // 2. Onboarding state is loaded (not loading)
    // 3. Onboarding is not complete (first login)
    // 4. Currently on dashboard route (/)
    if (token && userId && !isOnboardingLoading && !state.isComplete && isDashboardRoute) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [token, userId, isOnboardingLoading, state.isComplete, isDashboardRoute]);

  const handleOnboardingComplete = useCallback(() => {
    completeOnboarding();
    setShowModal(false);
  }, [completeOnboarding]);

  const handleOnboardingSkip = useCallback(() => {
    completeOnboarding();
    setShowModal(false);
  }, [completeOnboarding]);

  useEffect(() => {
    setShowAlertCallback((alertProps: AlertProps) => {
      setAlert(alertProps);
      setTimeout(() => setAlert(null), 5000);
    });

    // Initialize deployment update checking
    DeploymentManager.initializeUpdateCheck();

    return () => setShowAlertCallback(() => {});
  }, []);

  useEffect(() => {
    if (userPreferences) {
      localStorage.setItem("verifywise_preferences", JSON.stringify(userPreferences));
    }
  }, [userPreferences]);

  const [uiValues, setUiValues] = useState<UIValues>({});
  const [authValues, setAuthValues] = useState<AuthValues>({});
  const [dashboardValues, setDashboardValues] = useState<DashboardState>({
    dashboard: {},
    projects: {},
    compliance: {},
    assessments: {},
    vendors: [],
    users: [],
  });
  const [inputValues, setInputValues] = useState<InputValues>({});
  const [projects, setProjects] = useState<Project[]>([]);
  const [triggerSidebar, setTriggerSidebar] = useState(false);

  const userIdForProject = userId ?? 1;
  const {
    projectStatus,
    loading: loadingProjectStatus,
    error: errorFetchingProjectStatus,
  } = useProjectStatus({ userId: userIdForProject });

  const [currentProjectId, setCurrentProjectId] = useState<string | null>("");
  const [componentsVisible, setComponentsVisible] = useState<ComponentVisible>({
    home: false,
    sidebar: false,
    projectFrameworks: false,
    compliance: false,
  });
  const changeComponentVisibility = useCallback(
    (component: keyof ComponentVisible, value: boolean) => {
      setComponentsVisible((prev) => ({
        ...prev,
        [component]: value,
      }));
    },
    []
  );

  const [photoRefreshFlag, setPhotoRefreshFlag] = useState(false);

  const contextValues = useMemo(
    () => ({
      uiValues,
      setUiValues,
      authValues,
      setAuthValues,
      dashboardValues,
      setDashboardValues,
      inputValues,
      setInputValues,
      token,
      projectStatus,
      loadingProjectStatus,
      errorFetchingProjectStatus,
      currentProjectId,
      setCurrentProjectId,
      userId,
      projects,
      setProjects,
      componentsVisible,
      changeComponentVisibility,
      users,
      refreshUsers,
      userRoleName,
      organizationId,
      photoRefreshFlag,
      setPhotoRefreshFlag,
    }),
    [
      uiValues,
      setUiValues,
      authValues,
      setAuthValues,
      dashboardValues,
      setDashboardValues,
      inputValues,
      setInputValues,
      token,
      projectStatus,
      loadingProjectStatus,
      errorFetchingProjectStatus,
      currentProjectId,
      setCurrentProjectId,
      userIdForProject,
      projects,
      setProjects,
      componentsVisible,
      changeComponentVisibility,
      users,
      refreshUsers,
      userRoleName,
      organizationId,
      photoRefreshFlag,
      setPhotoRefreshFlag,
    ]
  );

  const triggerSidebarReload = () => {
    setTriggerSidebar((prev) => !prev);
  };

  return (
    <CookiesProvider>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <VerifyWiseContext.Provider value={contextValues}>
            <UserGuideSidebarProvider>
              <ConditionalThemeWrapper>
                {alert && (
                  <Alert
                    variant={alert.variant}
                    title={alert.title}
                    body={alert.body}
                    isToast={true}
                    onClick={() => setAlert(null)}
                  />
                )}
                <CommandPaletteErrorBoundary>
                  <CommandPalette
                    open={commandPalette.isOpen}
                    onOpenChange={commandPalette.close}
                  />
                </CommandPaletteErrorBoundary>
                {showModal && (
                  <OnboardingModal
                    onComplete={handleOnboardingComplete}
                    onSkip={handleOnboardingSkip}
                  />
                )}
                <Routes>
                  {createRoutes(triggerSidebar, triggerSidebarReload)}
                </Routes>

                {/* User Guide Sidebar */}
                <UserGuideSidebarContainer />
              </ConditionalThemeWrapper>
            </UserGuideSidebarProvider>
          </VerifyWiseContext.Provider>
        </PersistGate>
      </Provider>

      {/* React Query DevTools - Only in development */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </CookiesProvider>
  );
}

export default App;
