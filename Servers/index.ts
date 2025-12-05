import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { csrf } from "lusca";
// import { checkAndCreateTables } from "./database/db";

import assessmentRoutes from "./routes/assessment.route";
import controlRoutes from "./routes/control.route";
import projectRoutes from "./routes/project.route";
import risksRoutes from "./routes/risks.route";
import projectScopeRoutes from "./routes/projectScope.route";
import questionRoutes from "./routes/question.route";
import subcontrolRoutes from "./routes/subcontrol.route";
import subtopicRoutes from "./routes/subtopic.route";
import topicRoutes from "./routes/topic.route";
import userRoutes from "./routes/user.route";
import vendorRoutes from "./routes/vendor.route";
import vendorRiskRoutes from "./routes/vendorRisk.route";
import vendorChangeHistoryRoutes from "./routes/vendorChangeHistory.route";
import roleRoutes from "./routes/role.route";
import fileRoutes from "./routes/file.route";
import mailRoutes from "./routes/vwmailer.route";
import controlCategory from "./routes/controlCategory.route";
import euRouter from "./routes/eu.route";
import reportRoutes from "./routes/reporting.route";
import frameworks from "./routes/frameworks.route";
import organizationRoutes from "./routes/organization.route";
import isoRoutes from "./routes/iso42001.route";
import trainingRoutes from "./routes/trainingRegistar.route";
import biasAndFairnessRoutes from "./routes/biasAndFairnessRoutes.route";
import aiTrustCentreRoutes from "./routes/aiTrustCentre.route";
import policyRoutes from "./routes/policy.route";
import loggerRoutes from "./routes/logger.route";
import dashboardRoutes from "./routes/dashboard.route";
import iso27001Routes from "./routes/iso27001.route";
import modelInventoryRoutes from "./routes/modelInventory.route";
import modelInventoryHistoryRoutes from "./routes/modelInventoryHistory.route";
import modelInventoryChangeHistoryRoutes from "./routes/modelInventoryChangeHistory.route";
import riskHistoryRoutes from "./routes/riskHistory.route";
import modelRiskRoutes from "./routes/modelRisk.route";
import tiersRoutes from "./routes/tiers.route";
import subscriptionRoutes from "./routes/subscription.route";
import autoDriverRoutes from "./routes/autoDriver.route";
import taskRoutes from "./routes/task.route";
import slackWebhookRoutes from "./routes/slackWebhook.route";
import tokenRoutes from "./routes/tokens.route";
import shareLinkRoutes from "./routes/shareLink.route";
import automation from "./routes/automation.route.js";
import integrationsRoutes from "./routes/integrations.route.js";
import fileManagerRoutes from "./routes/fileManager.route";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { addAllJobs } from "./jobs/producer";
import aiIncidentRouter from "./routes/aiIncidentManagement.route";
import userPreferenceRouter from "./routes/userPreference.route";
import nistAiRmfRoutes from "./routes/nist_ai_rmf.route";
import evidenceHubRouter from "./routes/evidenceHub.route";
import ceMarkingRoutes from "./routes/ceMarking.route";
import searchRoutes from "./routes/search.route";
import deepEvalRoutes from "./routes/deepEvalRoutes.route";
import evaluationLlmApiKeyRoutes from "./routes/evaluationLlmApiKey.route";
import notesRoutes from "./routes/notes.route";

const swaggerDoc = YAML.load("./swagger.yaml");

const app = express();

const DEFAULT_PORT = "3000";
const DEFAULT_HOST = "localhost";

const portString = process.env.PORT || DEFAULT_PORT;
const host = process.env.HOST || DEFAULT_HOST;

const port = parseInt(portString, 10); // Convert to number

try {
  // (async () => {
  //   await checkAndCreateTables();
  // })();
  // Middlewares

  // Development
  // (async () => {
  //   await sequelize.sync();
  // })();

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) {
          return callback(null, true);
        }

        try {
          const originUrl = new URL(origin);
          const requestHost = originUrl.hostname;

          // Allow if origin is from same host (localhost, 127.0.0.1, or actual host)
          const allowedHosts = [host, 'localhost', '127.0.0.1', '::1'];

          if (allowedHosts.includes(requestHost)) {
            return callback(null, true);
          }

          // Reject other origins
          return callback(new Error("Not allowed by CORS"));
        } catch (error) {
          return callback(new Error("Invalid origin"));
        }
      },
      credentials: true,
      allowedHeaders: ["Authorization", "Content-Type", "X-Requested-With"],
    })
  );
  app.use(helmet()); // Use helmet for security headers
  app.use((req, res, next) => {
    if (req.url.includes("/api/bias_and_fairness/") || req.url.includes("/api/deepeval/")) {
      // Let the proxy handle the raw body
      return next();
    }
    express.json()(req, res, next);
  });
  app.use(cookieParser());
  // app.use(csrf());

  // Routes
  app.use("/api/users", userRoutes);
  app.use("/api/vendorRisks", vendorRiskRoutes);
  app.use("/api/vendors", vendorRoutes);
  app.use("/api/vendor-change-history", vendorChangeHistoryRoutes);
  app.use("/api/projects", projectRoutes);
  app.use("/api/questions", questionRoutes);
  app.use("/api/autoDrivers", autoDriverRoutes);
  app.use("/api/assessments", assessmentRoutes);
  // app.use("/api/controls", controlRoutes);
  app.use("/api/projectRisks", risksRoutes);
  // app.use("/api/projectScopes", projectScopeRoutes);
  // app.use("/api/subcontrols", subcontrolRoutes);
  // app.use("/api/subtopics", subtopicRoutes);
  // app.use("/api/topics", topicRoutes);
  app.use("/api/roles", roleRoutes);
  app.use("/api/files", fileRoutes);
  app.use("/api/mail", mailRoutes);
  // app.use("/api/controlCategory", controlCategory);
  app.use("/api/frameworks", frameworks);
  app.use("/api/eu-ai-act", euRouter); // **
  app.use("/api/organizations", organizationRoutes);
  app.use("/api/iso-42001", isoRoutes); // **
  app.use("/api/iso-27001", iso27001Routes); // **
  app.use("/api/training", trainingRoutes);
  app.use("/api/bias_and_fairness", biasAndFairnessRoutes());
  app.use("/api/aiTrustCentre", aiTrustCentreRoutes);
  app.use("/api/logger", loggerRoutes);
  app.use("/api/modelInventory", modelInventoryRoutes);
  app.use("/api/modelInventoryHistory", modelInventoryHistoryRoutes);
  app.use("/api/model-inventory-change-history", modelInventoryChangeHistoryRoutes);
  app.use("/api/riskHistory", riskHistoryRoutes);
  app.use("/api/modelRisks", modelRiskRoutes);
  app.use("/api/reporting", reportRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/tiers", tiersRoutes);
  app.use("/api/subscriptions", subscriptionRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));
  app.use("/api/policies", policyRoutes);
  app.use("/api/slackWebhooks", slackWebhookRoutes);
  app.use("/api/tokens", tokenRoutes);
  app.use("/api/shares", shareLinkRoutes);
  app.use("/api/file-manager", fileManagerRoutes);
  app.use("/api/automations", automation);
  app.use("/api/integrations/mlflow", integrationsRoutes);
  app.use("/api/user-preferences", userPreferenceRouter);
  app.use("/api/nist-ai-rmf", nistAiRmfRoutes);
  app.use("/api/evidenceHub", evidenceHubRouter);

  // Adding background jobs in the Queue
  (async () => {
    await addAllJobs();
  })();
  app.use("/api/ai-incident-managements", aiIncidentRouter);
  app.use("/api/ce-marking", ceMarkingRoutes);
  app.use("/api/search", searchRoutes);
  app.use("/api/deepeval", deepEvalRoutes());
  app.use("/api/evaluation-llm-keys", evaluationLlmApiKeyRoutes);
  app.use("/api/notes", notesRoutes);

  app.listen(port, () => {
    console.log(`Server running on port http://${host}:${port}/`);
  });
} catch (error) {
  console.error("Error setting up the server:", error);
}
