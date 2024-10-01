import express from "express";
import { createUser, deleteUser, findUser, getAllUsers, getUserFromId, resetPassword, updateUser } from "../controllers/users.controller";
import authenticateJWT from "../middlewares/auth.middleware";
const router = express.Router();

router.get("/", getAllUsers);
router.get("/find", findUser)
router.get("/:id", getUserFromId);
router.post("/", createUser);
router.delete("/:id", deleteUser);
router.patch("/:id", updateUser);
router.post("/reset-password", resetPassword)

// module.exports = router;
export default router;
