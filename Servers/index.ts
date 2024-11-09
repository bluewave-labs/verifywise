import express from "express";
import cors from "cors";

import userRoutes from "./routes/user.route";
import vendorRiskRoutes from "./routes/vendorRisk.route";
import vendorRoutes from "./routes/vendor.route";
import projectRoutes from "./routes/project.route";
import questionRoutes from "./routes/question.route";
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

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

app.use("/", (req, res) => {
  res.json("Hello buddy!");
});

// Routes

app.listen(port, () => {
  console.log(`Server running on port http://localhost:${port}/`);
});
