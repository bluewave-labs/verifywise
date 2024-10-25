import { Route, Routes } from "react-router-dom";
import "./App.css";
import { ThemeProvider } from "@emotion/react";
import Dashboard from "./presentation/containers/Dashboard";
import { useSelector } from "react-redux";
import light from "./presentation/themes/light";
import dark from "./presentation/themes/dark";
import { CssBaseline } from "@mui/material";
import Home from "./presentation/pages/Home";
import ComplianceTracker from "./presentation/pages/ComplianceTracker";
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

import { VerifyWiseContext } from "./application/contexts/VerifyWise.context";

function App() {
  const mode = useSelector((state: any) => state.ui?.mode || "light");
  return (
    <VerifyWiseContext.Provider value={{}}>
      <ThemeProvider theme={mode === "light" ? light : dark}>
        <CssBaseline />
        <Routes>
          <Route path="/" element={<Dashboard />}>
            <Route path="/" element={<Home />} />
            <Route path="/compliance-tracker" element={<ComplianceTracker />} />
            <Route path="/assessment" element={<Assessment />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/setting" element={<Setting />} />
            <Route path="/team" element={<Team />} />
            <Route path="/project-view" element={<ProjectView />} />
          </Route>
          <Route path="/admin-reg" element={<RegisterAdmin />} />
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
  );
}

export default App;
