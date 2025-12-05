import { Route, Navigate } from "react-router-dom";
import Dashboard from "../../presentation/containers/Dashboard";
import Home from "../../presentation/pages/Home";
import Vendors from "../../presentation/pages/Vendors";
import Integrations from "../../presentation/pages/Integrations";
import SlackManagement from "../../presentation/pages/Integrations/SlackManagement";
import MLFlowManagement from "../../presentation/pages/Integrations/MLFlowManagement";
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
import FileManager from "../../presentation/pages/FileManager";
import Reporting from "../../presentation/pages/Reporting";
import Playground from "../../presentation/pages";
import VWHome from "../../presentation/pages/Home/1.0Home";
import VWProjectView from "../../presentation/pages/ProjectView/V1.0ProjectView";
import PageNotFound from "../../presentation/pages/PageNotFound";
import ProtectedRoute from "../../presentation/components/ProtectedRoute";
import EvalsDashboard from "../../presentation/pages/EvalsDashboard/EvalsDashboard";
import OrgSettings from "../../presentation/pages/EvalsDashboard/OrgSettings";
import BuiltInDatasetsPage from "../../presentation/pages/EvalsDashboard/BuiltInDatasetsPage";
import DatasetEditorPage from "../../presentation/pages/EvalsDashboard/DatasetEditorPage";
import AITrustCenter from "../../presentation/pages/AITrustCenter";
import AITrustCentrePublic from "../../presentation/pages/AITrustCentrePublic";
import SharedView from "../../presentation/pages/SharedView";

import Training from "../../presentation/pages/TrainingRegistar";
import PolicyDashboard from "../../presentation/pages/PolicyDashboard/PoliciesDashboard";
import WatchTower from "../../presentation/pages/WatchTower";
import ModelInventory from "../../presentation/pages/ModelInventory";
import IncidentManagement from "../../presentation/pages/IncidentManagement";
import Framework from "../../presentation/pages/Framework";
import Tasks from "../../presentation/pages/Tasks";
import IntegratedDashboard from "../../presentation/pages/DashboardOverview/IntegratedDashboard";
import RiskManagement from "../../presentation/pages/RiskManagement";
import AutomationsPage from "../../presentation/pages/Automations";
import StyleGuide from "../../presentation/pages/StyleGuide";
import ReactFlowDemo from "../../presentation/pages/ReactFlowDemo";
import EntityGraph from "../../presentation/pages/EntityGraph";

// Check if we're in development mode
const isDev = import.meta.env.DEV;

export const createRoutes = (
  triggerSidebar: boolean,
  triggerSidebarReload: () => void
) => [
  // ReactFlow Demo - Development only (must be before dashboard route)
  ...(isDev ? [<Route key="reactflow-demo" path="/reactflow-demo" element={<ReactFlowDemo />} />] : []),
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
    <Route path="/vendors" element={<Vendors />}>
      <Route index element={<Vendors />} /> {/* Default tab */}
      <Route path="risks" element={<Vendors />} /> {/* Risks tab */}
    </Route>

    <Route path="/integrations" element={<Integrations />} />
    <Route path="/settings" element={<Setting />} />
    <Route path="/settings/:tab" element={<Setting />} />
    <Route path="/integrations/slack" element={<SlackManagement />} />
    <Route path="/integrations/mlflow" element={<MLFlowManagement />} />
    <Route path="/setting" element={<Navigate to="/settings" replace />} />
    <Route path="/organization" element={<Organization />} />
      <Route path="/file-manager" element={<FileManager />} />
    <Route path="/reporting" element={<Reporting />} />
    <Route index element={<IntegratedDashboard />} />
    <Route path="/overview" element={<VWHome />} />
    <Route path="/framework/:tab?" element={<Framework />} />
    <Route path="/project-view" element={<VWProjectView />} />
    <Route path="/fairness-dashboard" element={<FairnessDashboard />} />
    <Route path="/fairness-results/:id" element={<FairnessResultsPage />} />
    <Route path="/fairness-dashboard/bias-fairness-results/:id" element={<BiasAndFairnessResultsPage />} />
    <Route path="/fairness-dashboard/bias-fairness-results-demo" element={<BiasAndFairnessResultsPage />} />
    <Route path="/evals" element={<EvalsDashboard />} />
    <Route path="/evals/:projectId" element={<EvalsDashboard />} />
    <Route path="/evals/:projectId/datasets/built-in" element={<BuiltInDatasetsPage />} />
    <Route path="/evals/:projectId/datasets/editor" element={<DatasetEditorPage />} />
    <Route path="/evals/settings" element={<OrgSettings />} />
    <Route path="/training" element={<Training />} />
    <Route path="/ai-trust-center" element={<AITrustCenter />} />
    <Route path="/ai-trust-center/:tab" element={<AITrustCenter />} />
    <Route path="/policies" element={<PolicyDashboard />}>
      <Route index element={<PolicyDashboard />} /> {/* Default tab */}
      <Route path="templates" element={<PolicyDashboard />} /> {/* Policy Templates tab */}
    </Route>
    <Route path="/event-tracker" element={<WatchTower />} />
    <Route path="/event-tracker/logs" element={<WatchTower />} />
    <Route path="/model-inventory" element={<ModelInventory />} />
    <Route path="/model-inventory/model-risks" element={<ModelInventory />} />
    <Route path="/model-inventory/mlflow" element={<ModelInventory />} />
    <Route path="/model-inventory/evidence-hub" element={<ModelInventory />} />
    <Route path="/risk-management" element={<RiskManagement />} />
    <Route path="/tasks" element={<Tasks />} />
    <Route path="/automations" element={<AutomationsPage />} />
    <Route path="/ai-incident-managements" element={<IncidentManagement />} />
    <Route path="/entity-graph" element={<EntityGraph />} />
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
  // <Route key="public" path="/public" element={<AITrustCentrePublic />} />,
  <Route key="aiTrustCentrepublic" path="/aiTrustCentre/:hash" element={<AITrustCentrePublic />} />,
  <Route key="sharedView" path="/shared/:resourceType/:token" element={<SharedView />} />,
  // Style Guide - Development only
  ...(isDev ? [<Route key="style-guide" path="/style-guide/:section?" element={<StyleGuide />} />] : []),
  <Route key="sharedView" path="/shared/:resourceType/:token" element={<SharedView />} />,
  <Route key="not-found" path="*" element={<PageNotFound />} />,
];
