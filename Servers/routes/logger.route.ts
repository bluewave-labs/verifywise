import express from "express";
const router = express.Router();

router.get("/events", async (req, res) => {
  try {
    res.status(200).json({
      message: "Events fetched successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to get events" });
  }
});

router.get("/logs", async (req, res) => {
  try {
    res.status(200).json({
      message: "Logs fetched successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to get logs" });
  }
});

export default router;
