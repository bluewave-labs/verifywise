import { Routes } from "react-router-dom";
import "./App.css";
import { ThemeProvider } from "@emotion/react";
import { useSelector } from "react-redux";
import light from "./presentation/themes/light";
import dark from "./presentation/themes/dark";
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
import { DashboardState } from "./application/interfaces/appStates";
import { AppState } from "./application/interfaces/appStates";
import { ComponentVisible } from "./application/interfaces/ComponentVisible";
import { AlertProps } from "./domain/interfaces/iAlert";
import { setShowAlertCallback } from "./infrastructure/api/customAxios";
import Alert from "./presentation/components/Alert";
import useUsers from "./application/hooks/useUsers";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useLocation } from "react-router-dom";
import { DeploymentManager } from "./application/utils/deploymentHelpers";
import CommandPalette from "./presentation/components/CommandPalette";
import useCommandPalette from "./application/hooks/useCommandPalette";

// Component to conditionally apply theme based on route
const ConditionalThemeWrapper = ({ children, mode }: { children: React.ReactNode; mode: string }) => {
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
  
  // For other routes, apply theme normally
  return (
    <ThemeProvider theme={mode === "light" ? light : dark}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

function App() {
  const mode = useSelector((state: AppState) => state.ui?.mode || "light");
  const { token, userRoleName, organizationId, userId } = useAuth();
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const { users, refreshUsers } = useUsers();
  const commandPalette = useCommandPalette();

  useEffect(() => {
    setShowAlertCallback((alertProps: AlertProps) => {
      setAlert(alertProps);
      setTimeout(() => setAlert(null), 5000);
    });

    // Initialize deployment update checking
    DeploymentManager.initializeUpdateCheck();

    return () => setShowAlertCallback(() => {});
  }, []);

  const [uiValues, setUiValues] = useState<unknown | undefined>({});
  const [authValues, setAuthValues] = useState<unknown | undefined>({});
  const [dashboardValues, setDashboardValues] = useState<DashboardState>({
    dashboard: {},
    projects: {},
    compliance: {},
    assessments: {},
    vendors: [],
  });
  const [inputValues, setInputValues] = useState<unknown | undefined>({});
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
      organizationId
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
      organizationId
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
            <ConditionalThemeWrapper mode={mode}>
              {alert && (
                <Alert
                  variant={alert.variant}
                  title={alert.title}
                  body={alert.body}
                  isToast={true}
                  onClick={() => setAlert(null)}
                />
              )}
              <CommandPalette
                open={commandPalette.isOpen}
                onOpenChange={commandPalette.close}
              />
              <Routes>
                {createRoutes(triggerSidebar, triggerSidebarReload)}
              </Routes>
            </ConditionalThemeWrapper>
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
