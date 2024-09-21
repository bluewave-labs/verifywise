const router = require("express").Router();

router.get("/", async (req, res) => {
  // Add logic to get users
  res.send("User route, get, '/' ");
});

router.get("/:id", async (req, res) => {
  const userId = req.params.id;
  // Add logic to get the user by userId
  res.send(`User route, get, '/${userId}'`);
});

router.post("/", async (req, res) => {
  // Add logic to create a user
  res.send("User route, post, '/' ");
});

router.delete("/:id", async (req, res) => {
  const userId = req.params.id;
  // Add logic to delete the user by userId
  res.send(`User route, delete, '/${userId}'`);
});

router.patch("/:id", async (req, res) => {
  const userId = req.params.id;
  // Add logic to update the user by userId
  res.send(`User route, patch, '/${userId}'`);
});

module.exports = router;
