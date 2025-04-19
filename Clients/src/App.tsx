import { Routes } from "react-router-dom";
import "./App.css";
import { ThemeProvider } from "@emotion/react";
import { useSelector } from "react-redux";
import light from "./presentation/themes/light";
import dark from "./presentation/themes/dark";
import { CssBaseline } from "@mui/material";
import { VerifyWiseContext } from "./application/contexts/VerifyWise.context";
import { useMemo, useState } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./application/redux/store";
import useProjectStatus from "./application/hooks/useProjectStatus";
import { extractUserToken } from "./application/tools/extractToken";
import { Project } from "./domain/Project";
import { CookiesProvider } from "react-cookie";
import { createRoutes } from "./application/config/routes";
import { DashboardState } from "./application/interfaces/appStates";
import { AppState } from "./application/interfaces/appStates";

function App() {
  const mode = useSelector((state: AppState) => state.ui?.mode || "light");
  const token = useSelector((state: AppState) => state.auth?.authToken);

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

  const userId = token ? extractUserToken(token)?.id ?? "1" : "1";
  const {
    projectStatus,
    loading: loadingProjectStatus,
    error: errorFetchingProjectStatus,
  } = useProjectStatus({ userId });

  const [currentProjectId, setCurrentProjectId] = useState<string | null>("");

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
