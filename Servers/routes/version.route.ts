import express from "express";
import { readFileSync } from "fs";
import { join } from "path";

// Read from the shared root version.json so frontend and backend always
// agree on the version string. From dist/routes/ → go up three levels
// to reach the repository root.
const versionPath = join(__dirname, "..", "..", "..", "version.json");
const { version } = JSON.parse(readFileSync(versionPath, "utf-8"));

const router = express.Router();

router.get("/", (_req, res) => {
  res.json({ version });
});

export default router;
