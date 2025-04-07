import { Route, Routes } from "react-router-dom";
import "./App.css";
import { ThemeProvider } from "@emotion/react";
import Dashboard from "./presentation/containers/Dashboard";
import { useSelector } from "react-redux";
import light from "./presentation/themes/light";
import dark from "./presentation/themes/dark";
import { CssBaseline } from "@mui/material";
import Home from "./presentation/pages/Home";
import Vendors from "./presentation/pages/Vendors";
import Setting from "./presentation/pages/SettingsPage";
import Team from "./presentation/pages/Team";
import RegisterAdmin from "./presentation/pages/Authentication/RegisterAdmin";
import RegisterUser from "./presentation/pages/Authentication/RegisterUser";
import Login from "./presentation/pages/Authentication/Login";
import ForgotPassword from "./presentation/pages/Authentication/ForgotPassword";
import ResetPassword from "./presentation/pages/Authentication/ResetPassword";
import SetNewPassword from "./presentation/pages/Authentication/SetNewPassword";
import ResetPasswordContinue from "./presentation/pages/Authentication/ResetPasswordContinue";
import ProjectView from "./presentation/pages/ProjectView";
import FileManager from "./presentation/pages/FileManager";
import Reporting from "./presentation/pages/Reporting";

import { VerifyWiseContext } from "./application/contexts/VerifyWise.context";
import { useMemo, useState } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./application/redux/store"; // Adjust the path as necessary
import useProjectStatus from "./application/hooks/useProjectStatus";
import ProtectedRoute from "./presentation/components/ProtectedRoute";
import { extractUserToken } from "./application/tools/extractToken"; // Import the token extraction function
import Playground from "./presentation/pages";
import AssessmentTracker from "./presentation/pages/Assessment/1.0AssessmentTracker";
import ComplianceTracker from "./presentation/pages/ComplianceTracker/1.0ComplianceTracker";
import VWHome from "./presentation/pages/Home/1.0Home";
import VWProjectView from "./presentation/pages/ProjectView/V1.0ProjectView";
import { Project } from "./domain/Project";
import PageNotFound from "./presentation/pages/PageNotFound";
import { CookiesProvider } from 'react-cookie';
import { JoyrideRefProvider } from "./application/contexts/JoyrideRefContext";

function App() {
  const mode = useSelector((state: any) => state.ui?.mode || "light");
  const token = useSelector(
    (state: { auth: { authToken: string } }) => state.auth.authToken
  );

  const [uiValues, setUiValues] = useState<unknown | undefined>({}); // responsible for things like: Sidebar, light/dark mode, etc.
  const [authValues, setAuthValues] = useState<unknown | undefined>({}); // for user authentication
  const [dashboardValues, setDashboardValues] = useState<{
    dashboard: Record<string, unknown>;
    projects: Record<string, unknown>;
    compliance: Record<string, unknown>;
    assessments: Record<string, unknown>;
    vendors: unknown[];
  }>({
    dashboard: {},
    projects: {},
    compliance: {},
    assessments: {},
    vendors: [],
  });
  const [inputValues, setInputValues] = useState<unknown | undefined>({}); // for the input fields
  const [projects, setProjects] = useState<Project[]>([]);
  const [triggerSidebar, setTriggerSidebar] = useState(false);

  // Extract userId from token
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
          <JoyrideRefProvider>
            <VerifyWiseContext.Provider value={contextValues}>
              <ThemeProvider theme={mode === "light" ? light : dark}>
                <CssBaseline />
                <Routes>
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute
                        Component={Dashboard}
                        reloadTrigger={triggerSidebar}
                      />
                    }
                  >
                    <Route
                      path="/test"
                      element={<Home onProjectUpdate={triggerSidebarReload} />}
                    />
                    <Route
                      path="/compliance-tracker"
                      element={<ComplianceTracker />}
                    />
                    <Route path="/assessment" element={<AssessmentTracker />} />
                    <Route path="/vendors" element={<Vendors />} />
                    <Route path="/setting" element={<Setting />} />
                    <Route path="/team" element={<Team />} />
                    <Route
                      path="/test/project-view"
                      element={<ProjectView />}
                    />
                    <Route path="/file-manager" element={<FileManager />} />
                    <Route path="/reporting" element={<Reporting />} />
                    <Route path="/" element={<VWHome />} />
                    <Route path="/project-view" element={<VWProjectView />} />
                  </Route>
                  <Route
                    path="/admin-reg"
                    element={<ProtectedRoute Component={RegisterAdmin} />}
                  />
                  <Route
                    path="/user-reg"
                    element={<ProtectedRoute Component={RegisterUser} />}
                  />
                  <Route
                    path="/login"
                    element={<ProtectedRoute Component={Login} />}
                  />
                  <Route
                    path="/forgot-password"
                    element={<ProtectedRoute Component={ForgotPassword} />}
                  />
                  <Route
                    path="/reset-password"
                    element={<ProtectedRoute Component={ResetPassword} />}
                  />
                  <Route
                    path="/set-new-password"
                    element={<ProtectedRoute Component={SetNewPassword} />}
                  />
                  <Route
                    path="/reset-password-continue"
                    element={
                      <ProtectedRoute Component={ResetPasswordContinue} />
                    }
                  />
                  <Route path="/playground" element={<Playground />} />
                  <Route path="*" element={<PageNotFound />} />
                </Routes>
              </ThemeProvider>
            </VerifyWiseContext.Provider>
          </JoyrideRefProvider>
        </PersistGate>
      </Provider>
    </CookiesProvider>
  );
}

export default App;
