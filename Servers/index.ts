import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
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
import modelRiskRoutes from "./routes/modelRisk.route";
import tiersRoutes from "./routes/tiers.route";
import subscriptionRoutes from "./routes/subscription.route";
import autoDriverRoutes from "./routes/autoDriver.route";
import taskRoutes from "./routes/task.route";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { parseOrigins, testOrigin } from "./utils/parseOrigins.utils";
import { frontEndUrl } from "./config/constants";

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

  const allowedOrigins = parseOrigins(
    process.env.ALLOWED_ORIGINS || frontEndUrl
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        testOrigin({ origin, allowedOrigins, callback });
      },
      credentials: true,
      allowedHeaders: ["Authorization", "Content-Type", "X-Requested-With"],
    })
  );
  app.use(helmet()); // Use helmet for security headers
  app.use((req, res, next) => {
    if (req.url.includes("/api/bias_and_fairness/")) {
      // Let the proxy handle the raw body
      return next();
    }
    express.json()(req, res, next);
  });
  app.use(cookieParser());

  // Routes
  app.use("/api/users", userRoutes);
  app.use("/api/vendorRisks", vendorRiskRoutes);
  app.use("/api/vendors", vendorRoutes);
  app.use("/api/projects", projectRoutes);
  app.use("/api/questions", questionRoutes);
  app.use("/api/autoDrivers", autoDriverRoutes);
  app.use("/api/assessments", assessmentRoutes);
  app.use("/api/controls", controlRoutes);
  app.use("/api/projectRisks", risksRoutes);
  app.use("/api/projectScopes", projectScopeRoutes);
  app.use("/api/subcontrols", subcontrolRoutes);
  app.use("/api/subtopics", subtopicRoutes);
  app.use("/api/topics", topicRoutes);
  app.use("/api/roles", roleRoutes);
  app.use("/api/files", fileRoutes);
  app.use("/api/mail", mailRoutes);
  app.use("/api/controlCategory", controlCategory);
  app.use("/api/frameworks", frameworks);
  app.use("/api/eu-ai-act", euRouter);
  app.use("/api/organizations", organizationRoutes);
  app.use("/api/iso-42001", isoRoutes);
  app.use("/api/iso-27001", iso27001Routes);
  app.use("/api/training", trainingRoutes);
  app.use("/api/bias_and_fairness", biasAndFairnessRoutes());
  app.use("/api/aiTrustCentre", aiTrustCentreRoutes);
  app.use("/api/logger", loggerRoutes);
  app.use("/api/modelInventory", modelInventoryRoutes);
  app.use("/api/modelRisks", modelRiskRoutes);
  app.use("/api/reporting", reportRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/tiers", tiersRoutes);
  app.use("/api/subscriptions", subscriptionRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));
  app.use("/api/policies", policyRoutes);

  app.listen(port, () => {
    console.log(`Server running on port http://${host}:${port}/`);
  });
} catch (error) {
  console.error("Error setting up the server:", error);
}
