import express from "express";
const router = express.Router();

// get all clauses
router.get("/clauses", async (req, res) => {
  res.send("iso27001 clauses");
});

// get all annexes
router.get("/annexes", async (req, res) => {
  res.send("iso27001 annexes");
});

export default router;
