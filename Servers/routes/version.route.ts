import express from "express";
import { readFileSync } from "fs";
import { join } from "path";

// From dist/routes/ → go up twice to reach Servers/package.json
const pkgPath = join(__dirname, "..", "..", "package.json");
const { version } = JSON.parse(readFileSync(pkgPath, "utf-8"));

const router = express.Router();

router.get("/", (_req, res) => {
  res.json({ version });
});

export default router;
