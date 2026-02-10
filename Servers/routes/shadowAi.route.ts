import express from "express";
const router = express.Router();
import authenticateJWT from "../middleware/auth.middleware";
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
} from "../controllers/shadowAiApiKey.ctrl";
import {
  getInsightsSummary,
  getToolsByEvents,
  getToolsByUsers,
  getUsersByDepartment,
  getTrend,
  getUsers,
  getUserDetail,
  getDepartmentActivity,
  getTools,
  getToolById,
  updateToolStatus,
  startGovernance,
  getRules,
  createRule,
  updateRule,
  deleteRule,
  getAlertHistory,
  getSyslogConfigs,
  createSyslogConfig,
  updateSyslogConfig,
  deleteSyslogConfig,
} from "../controllers/shadowAi.ctrl";

// ─── API Keys (Admin only) ─────────────────────────────────────────────
router.post("/api-keys", authenticateJWT, createApiKey);
router.get("/api-keys", authenticateJWT, listApiKeys);
router.delete("/api-keys/:id", authenticateJWT, revokeApiKey);

// ─── Insights ───────────────────────────────────────────────────────────
router.get("/insights/summary", authenticateJWT, getInsightsSummary);
router.get("/insights/tools-by-events", authenticateJWT, getToolsByEvents);
router.get("/insights/tools-by-users", authenticateJWT, getToolsByUsers);
router.get("/insights/users-by-department", authenticateJWT, getUsersByDepartment);
router.get("/insights/trend", authenticateJWT, getTrend);

// ─── User Activity ──────────────────────────────────────────────────────
router.get("/users", authenticateJWT, getUsers);
router.get("/users/:email/activity", authenticateJWT, getUserDetail);
router.get("/departments", authenticateJWT, getDepartmentActivity);

// ─── Tools ──────────────────────────────────────────────────────────────
router.get("/tools", authenticateJWT, getTools);
router.get("/tools/:id", authenticateJWT, getToolById);
router.patch("/tools/:id/status", authenticateJWT, updateToolStatus);
router.post("/tools/:id/start-governance", authenticateJWT, startGovernance);

// ─── Rules ──────────────────────────────────────────────────────────────
router.get("/rules", authenticateJWT, getRules);
router.post("/rules", authenticateJWT, createRule);
router.patch("/rules/:id", authenticateJWT, updateRule);
router.delete("/rules/:id", authenticateJWT, deleteRule);
router.get("/rules/alert-history", authenticateJWT, getAlertHistory);

// ─── Configuration ──────────────────────────────────────────────────────
router.get("/config/syslog", authenticateJWT, getSyslogConfigs);
router.post("/config/syslog", authenticateJWT, createSyslogConfig);
router.patch("/config/syslog/:id", authenticateJWT, updateSyslogConfig);
router.delete("/config/syslog/:id", authenticateJWT, deleteSyslogConfig);

export default router;
