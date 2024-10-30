import express from "express";
import cors from "cors";

import userRoutes from "./routes/user.route";
import roleRoutes from "./routes/role.route";
import requirementsRoutes from "./routes/requirement.route";
import complianceListRoutes from "./routes/complianceList.route";
import complianceTrackerRoutes from "./routes/complianceTracker.route";
import vendorRiskRoutes from "./routes/vendorRisk.route";
import riskRoutes from "./routes/risk.route";
import vendorRoutes from "./routes/vendor.route";
import projectRoutes from "./routes/project.route";
import subrequirementsRoutes from "./routes/subrequirement.route";
import overviewsRoutes from "./routes/overview.route";
import evidencesRoutes from "./routes/evidence.route";
import auditorFeedbacks from "./routes/auditorFeedback.route";
import assessmentTrackers from "./routes/assessmentTracker.route";
import sectionRoutes from "./routes/section.route";
import questionRoutes from "./routes/question.route";
import questionEvidenceRoutes from "./routes/questionEvidence.route";
import subrequirementEvidence from "./routes/subrequirementEvidence.route";
import autoDriverRoutes from "./routes/autoDriver.route";

import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

const swaggerDoc = YAML.load("./swagger.yaml")

const app = express();

const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use("/users", userRoutes);
app.use("/roles", roleRoutes);
app.use("/requirements", requirementsRoutes);
app.use("/complianceLists", complianceListRoutes);
app.use("/complianceTrackers", complianceTrackerRoutes);
app.use("/vendorRisks", vendorRiskRoutes);
app.use("/risks", riskRoutes);
app.use("/vendors", vendorRoutes);
app.use("/projects", projectRoutes);
app.use("/subrequirements", subrequirementsRoutes);
app.use("/overviews", overviewsRoutes);
app.use("/evidences", evidencesRoutes);
app.use("/auditorFeedbacks", auditorFeedbacks);
app.use("/assessmentTrackers", assessmentTrackers);
app.use("/sections", sectionRoutes);
app.use("/questions", questionRoutes);
app.use("/questionEvidence", questionEvidenceRoutes);
app.use("/subrequirementEvidence", subrequirementEvidence);
app.use("/autoDrivers", autoDriverRoutes);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

app.use("/", (req, res) => {
  res.json("Hello buddy!");
});

// Routes

app.listen(port, () => {
  console.log(`Server running on port http://localhost:${port}/`);
});
