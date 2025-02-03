import { Route, Routes } from "react-router-dom";
import "./App.css";
import { ThemeProvider } from "@emotion/react";
import Dashboard from "./presentation/containers/Dashboard";
import { useSelector } from "react-redux";
import light from "./presentation/themes/light";
import dark from "./presentation/themes/dark";
import { CssBaseline } from "@mui/material";
import Home from "./presentation/pages/Home";
import Assessment from "./presentation/pages/Assessment";
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
import Playground from "./presentation/pages";
import FileManager from "./presentation/pages/FileManager";

import { VerifyWiseContext } from "./application/contexts/VerifyWise.context";
import { useMemo, useState } from "react";
import AllAssessment from "./presentation/pages/Assessment/NewAssessment/AllAssessments";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./application/redux/store"; // Adjust the path as necessary
import NewComplianceTracker from "./presentation/pages/ComplianceTracker/NewComplianceTracker";
import useProjectStatus from "./application/hooks/useProjectStatus";
import ProtectedRoute from "./presentation/components/ProtectedRoute";
import { extractUserToken } from "./application/tools/extractToken"; // Import the token extraction function

function App() {
  const mode = useSelector((state: any) => state.ui?.mode || "light");

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
  const [token, setToken] = useState<string | null>("");
  const [triggerSidebar, setTriggerSidebar] = useState(false);

  // Extract userId from token
  const userId = token ? extractUserToken(token)?.id ?? "1" : "1";
  const {
    projectStatus,
    loading: loadingProjectStatus,
    error: errorFetchingProjectStatus,
  } = useProjectStatus({ userId });

  const login = (token: string) => {
    setToken(token);
  };

  const logout = () => {
    setToken(null);
  };

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
      login,
      logout,
      projectStatus,
      loadingProjectStatus,
      errorFetchingProjectStatus,
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
      login,
      logout,
      projectStatus,
      loadingProjectStatus,
      errorFetchingProjectStatus,
    ]
  );

  const triggerSidebarReload = () => {
    setTriggerSidebar((prev) => !prev);
  };

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <VerifyWiseContext.Provider value={contextValues}>
          <ThemeProvider theme={mode === "light" ? light : dark}>
            <CssBaseline />
            <Routes>
              <Route
                path="/"
                // element={
                //   <ProtectedRoute
                //     Component={Dashboard}
                //     reloadTrigger={triggerSidebar}
                //   />
                // }
                element={<Dashboard reloadTrigger={triggerSidebar}/> }
              >
                <Route
                  path="/"
                  element={<Home onProjectUpdate={triggerSidebarReload} />}
                />
                <Route
                  path="/compliance-tracker"
                  element={<NewComplianceTracker />}
                />
                <Route path="/assessment" element={<Assessment />} />
                <Route path="/all-assessments" element={<AllAssessment />} />
                <Route path="/vendors" element={<Vendors />} />
                <Route path="/setting" element={<Setting />} />
                <Route path="/team" element={<Team />} />
                <Route path="/project-view" element={<ProjectView />} />
                <Route path="/file-manager" element={<FileManager />} />
              </Route>
              <Route
                path="/admin-reg"
                element={<ProtectedRoute Component={RegisterAdmin} />}
              />
              <Route path="/user-reg" element={<RegisterUser />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/set-new-password" element={<SetNewPassword />} />
              <Route
                path="/reset-password-continue"
                element={<ResetPasswordContinue />}
              />

              {/** This route is simply for testing and playing with components and will be removed soon  */}
              <Route path="/playground" element={<Playground />} />
            </Routes>
          </ThemeProvider>
        </VerifyWiseContext.Provider>
      </PersistGate>
    </Provider>
  );
}

export default App;
