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
import { extractUserToken } from "./application/tools/extractToken";
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

function App() {
  const mode = useSelector((state: AppState) => state.ui?.mode || "light");
  const token = useSelector((state: AppState) => state.auth?.authToken);
  const userToken = token ? extractUserToken(token) : null;
  const userRoleName = userToken?.roleName || "";
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const { users, refreshUsers } = useUsers();

  useEffect(() => {
    setShowAlertCallback((alertProps: AlertProps) => {
      setAlert(alertProps);
      setTimeout(() => setAlert(null), 5000);
    });
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

  const userId = extractUserToken(token)?.id ?? 1;
  const {
    projectStatus,
    loading: loadingProjectStatus,
    error: errorFetchingProjectStatus,
  } = useProjectStatus({ userId });

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
      userId,
      projects,
      setProjects,
      componentsVisible,
      changeComponentVisibility,
      users,
      refreshUsers,
      userRoleName,
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
            <ThemeProvider theme={mode === "light" ? light : dark}>
              <CssBaseline />
              {alert && (
                <Alert
                  variant={alert.variant}
                  title={alert.title}
                  body={alert.body}
                  isToast={true}
                  onClick={() => setAlert(null)}
                />
              )}
              <Routes>
                {createRoutes(triggerSidebar, triggerSidebarReload)}
              </Routes>
            </ThemeProvider>
          </VerifyWiseContext.Provider>
        </PersistGate>
      </Provider>
    </CookiesProvider>
  );
}

export default App;
