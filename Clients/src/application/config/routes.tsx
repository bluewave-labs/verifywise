import { Route } from "react-router-dom";
import Dashboard from "../../presentation/containers/Dashboard";
import Home from "../../presentation/pages/Home";
import Vendors from "../../presentation/pages/Vendors";
import Setting from "../../presentation/pages/SettingsPage";
import Organization from "../../presentation/pages/SettingsPage/Organization";
import RegisterAdmin from "../../presentation/pages/Authentication/RegisterAdmin";
import RegisterUser from "../../presentation/pages/Authentication/RegisterUser";
import RegisterMultiTenant from "../../presentation/pages/Authentication/RegisterMultiTenant";
import Login from "../../presentation/pages/Authentication/Login";
import ForgotPassword from "../../presentation/pages/Authentication/ForgotPassword";
import ResetPassword from "../../presentation/pages/Authentication/ResetPassword";
import SetNewPassword from "../../presentation/pages/Authentication/SetNewPassword";
import ResetPasswordContinue from "../../presentation/pages/Authentication/ResetPasswordContinue";
import ProjectView from "../../presentation/pages/ProjectView";
import FileManager from "../../presentation/pages/FileManager";
import Reporting from "../../presentation/pages/Reporting";
import Playground from "../../presentation/pages";
import VWHome from "../../presentation/pages/Home/1.0Home";
import VWProjectView from "../../presentation/pages/ProjectView/V1.0ProjectView";
import PageNotFound from "../../presentation/pages/PageNotFound";
import ProtectedRoute from "../../presentation/components/ProtectedRoute";
import FairnessDashboard from "../../presentation/pages/FairnessDashboard/FairnessDashboard";
import FairnessResultsPage from "../../presentation/pages/FairnessDashboard/FairnessResultsPage";
import AITrustCenter from "../../presentation/pages/AITrustCenter";

import Training from "../../presentation/pages/TrainingRegistar";

export const createRoutes = (
  triggerSidebar: boolean,
  triggerSidebarReload: () => void
) => [
  <Route
    key="dashboard"
    path="/"
    element={
      <ProtectedRoute Component={Dashboard} reloadTrigger={triggerSidebar} />
    }
  >
    <Route
      path="/test"
      element={<Home onProjectUpdate={triggerSidebarReload} />}
    />
    <Route path="/vendors" element={<Vendors />} />
    <Route path="/setting" element={<Setting />} />
    <Route path="/organization" element={<Organization />} />
    <Route path="/test/project-view" element={<ProjectView />} />
    <Route path="/file-manager" element={<FileManager />} />
    <Route path="/reporting" element={<Reporting />} />
    <Route path="/" element={<VWHome />} />
    <Route path="/project-view" element={<VWProjectView />} />
    <Route path="/fairness-dashboard" element={<FairnessDashboard />} />
    <Route path="/fairness-results/:id" element={<FairnessResultsPage />} />
    <Route path="/training" element={<Training />}/>
    <Route path="/ai-trust-center" element={<AITrustCenter />} />
  </Route>,
  <Route
    key="admin-reg"
    path="/admin-reg"
    element={<ProtectedRoute Component={RegisterAdmin} />}
  />,
  <Route
    key="user-reg"
    path="/user-reg"
    element={<ProtectedRoute Component={RegisterUser} />}
  />,
  <Route
    key="register"
    path="/register"
    element={<ProtectedRoute Component={RegisterMultiTenant} />}
  />,
  <Route
    key="login"
    path="/login"
    element={<ProtectedRoute Component={Login} />}
  />,
  <Route
    key="forgot-password"
    path="/forgot-password"
    element={<ProtectedRoute Component={ForgotPassword} />}
  />,
  <Route
    key="reset-password"
    path="/reset-password"
    element={<ProtectedRoute Component={ResetPassword} />}
  />,
  <Route
    key="set-new-password"
    path="/set-new-password"
    element={<ProtectedRoute Component={SetNewPassword} />}
  />,
  <Route
    key="reset-password-continue"
    path="/reset-password-continue"
    element={<ProtectedRoute Component={ResetPasswordContinue} />}
  />,
  <Route key="playground" path="/playground" element={<Playground />} />,
  <Route key="not-found" path="*" element={<PageNotFound />} />,
];
