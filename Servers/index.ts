import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import userRoutes from "./routes/user.route";
import roleRoutes from "./routes/role.route";
<<<<<<< HEAD
import vendorRiskRoutes from "./routes/vendorRisk.route";
=======
>>>>>>> 7aefaf4c211d0559fa2b03488758cc11966e0f20
import riskRoutes from "./routes/risk.route";

dotenv.config();

const app = express();

const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use("/users", userRoutes);
app.use("/roles", roleRoutes);
app.use("/vendorRisks", vendorRiskRoutes);
app.use("/risks", riskRoutes);

app.use("/", (req, res) => {
  res.json("Hello buddy!");
});

// Routes

app.listen(port, () => {
  console.log(`Server running on port http://localhost:${port}/`);
});
