import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
// import { checkAndCreateTables } from "./database/db";

import assessmentRoutes from "./routes/assessment.route";
import controlRoutes from "./routes/control.route";
import projectRoutes from "./routes/project.route";
import projectRisksRoutes from "./routes/projectRisks.route";
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

import autoDriverRoutes from "./routes/autoDriver.route";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { parseOrigins, testOrigin } from "./utils/parseOrigins";

const swaggerDoc = YAML.load("./swagger.yaml");

const app = express();

const DEFAULT_PORT = "3000";
const DEFAULT_HOST = "localhost";

const portString = process.env.PORT || DEFAULT_PORT;
const host = process.env.HOST || DEFAULT_HOST;

const port = parseInt(portString, 10); // Convert to number

const DEFAULT_FRONTEND_URL = "http://localhost:8082";

const frontEndUrl = process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL;

try {
  // (async () => {
  //   await checkAndCreateTables();
  // })();
  // Middlewares

  // Development
  // (async () => {
  //   await sequelize.sync();
  // })();

  const allowedOrigins = parseOrigins(frontEndUrl);

  app.use(
    cors({
      origin: (origin, callback) => {
        testOrigin({origin, allowedOrigins , callback});
      },
      credentials: true,
    })
  );
  app.use(helmet()); // Use helmet for security headers
  app.use(express.json());
  app.use(cookieParser());

  // Routes
  app.use("/users", userRoutes);
  app.use("/vendorRisks", vendorRiskRoutes);
  app.use("/vendors", vendorRoutes);
  app.use("/projects", projectRoutes);
  app.use("/questions", questionRoutes);
  app.use("/autoDrivers", autoDriverRoutes);
  app.use("/assessments", assessmentRoutes);
  app.use("/controls", controlRoutes);
  app.use("/projectRisks", projectRisksRoutes);
  app.use("/projectScopes", projectScopeRoutes);
  app.use("/subcontrols", subcontrolRoutes);
  app.use("/subtopics", subtopicRoutes);
  app.use("/topics", topicRoutes);
  app.use("/roles", roleRoutes);
  app.use("/files", fileRoutes);
  app.use("/mail", mailRoutes);
  app.use("/controlCategory", controlCategory);

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

  app.use("/", (req, res) => {
    res.json("Welcome to  VerifyWise root directory.");
  });

  app.listen(port, () => {
    console.log(`Server running on port http://${host}:${port}/`);
  });
} catch (error) {
  console.error("Error setting up the server:", error);
}
