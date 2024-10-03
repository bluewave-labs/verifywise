import express from "express";
import { getAllUsers } from "../controllers/user.ctrl";
const router = express.Router();

router.get("/", getAllUsers);

router.get("/test", (req, res) => {
  res.send("Hello World!");
});

export default router;
