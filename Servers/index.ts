import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes

app.listen(port, () => {
  console.log(`Server running on port http://localhost:${port}/`);
});
