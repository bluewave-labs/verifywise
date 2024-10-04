import express from "express";
import { createUser, deleteUser, findUser, getAllUsers, getUserFromId, login, resetPassword, updateUser } from "../controllers/users.controller";
import authenticateJWT from "../middlewares/auth.middleware";
const router = express.Router();

router.get("/", authenticateJWT, getAllUsers);
router.get("/find", authenticateJWT, findUser)
router.get("/:id", authenticateJWT, getUserFromId);
router.delete("/:id", authenticateJWT, deleteUser);
router.patch("/:id", authenticateJWT, updateUser);
router.post("/reset-password", resetPassword)
router.post("/signup", createUser);
router.post("/login", login)

// module.exports = router;
export default router;
