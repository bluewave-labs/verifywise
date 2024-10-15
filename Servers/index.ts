import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import userRoutes from "./routes/user.route";
import roleRoutes from "./routes/role.route";
import complianceTrackerRoutes from "./routes/complianceTracker.route";
import vendorRiskRoutes from "./routes/vendorRisk.route";
import riskRoutes from "./routes/risk.route";
import vendorRoutes from "./routes/vendor.route";
import projectRoutes from "./routes/project.route";
import auditorFeedbacks from "./routes/auditorFeedback.route";

dotenv.config();

const app = express();

const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use("/users", userRoutes);
app.use("/roles", roleRoutes);
app.use("/complianceTrackers", complianceTrackerRoutes);
app.use("/vendorRisks", vendorRiskRoutes);
app.use("/risks", riskRoutes);
app.use("/vendors", vendorRoutes)
app.use("/projects", projectRoutes);
app.use("/auditorFeedbacks", auditorFeedbacks);

app.use("/", (req, res) => {
  res.json("Hello buddy!");
});

// Routes

app.listen(port, () => {
  console.log(`Server running on port http://localhost:${port}/`);
});
