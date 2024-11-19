import express from "express";
import cors from "cors";

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

import autoDriverRoutes from "./routes/autoDriver.route";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

const swaggerDoc = YAML.load("./swagger.yaml");

const app = express();

const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
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

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

app.use("/", (req, res) => {
  res.json("Hello buddy!");
});

// Routes

app.listen(port, () => {
  console.log(`Server running on port http://localhost:${port}/`);
});
