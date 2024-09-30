import express from "express";
import cors from "cors";
import userRouter from "./routes/users.route";
import dotenv from "dotenv";

const app = express();
dotenv.config();

const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/users", userRouter);

app.listen(port, () => {
  console.log(`Server running on port http://localhost:${port}/`);
});
