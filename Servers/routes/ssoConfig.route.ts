import express from "express";
import authenticateJWT from "../middleware/auth.middleware";
import { disableSSO, enableSSO, getSSOConfigForOrg, saveSSOConfig } from "../controllers/ssoConfig.ctrl";
const router = express.Router();

router.get("/", authenticateJWT, getSSOConfigForOrg);
router.put("/", authenticateJWT, saveSSOConfig);
router.put("/enable", authenticateJWT, enableSSO);
router.put("/disable", authenticateJWT, disableSSO);

// router.delete("/", );

export default router;