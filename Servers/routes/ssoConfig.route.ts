import express from "express";
import authenticateJWT from "../middleware/auth.middleware";
import { checkSSOStatusByOrgId, disableSSO, enableSSO, getSSOConfigForOrg, saveSSOConfig } from "../controllers/ssoConfig.ctrl";
const router = express.Router();

// Public endpoint for login page to check SSO status by organization ID
router.get("/check-status", checkSSOStatusByOrgId);

router.get("/", /** authenticateJWT, **/ getSSOConfigForOrg);
router.put("/", authenticateJWT, saveSSOConfig);
router.put("/enable", authenticateJWT, enableSSO);
router.put("/disable", authenticateJWT, disableSSO);

// router.delete("/", );

export default router;