import express from "express";
import { getAllUsers } from "../controllers/user.ctrl";
const router = express.Router();

router.get("/", getAllUsers);

export default router;
