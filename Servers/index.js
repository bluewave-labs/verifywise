const express = require("express");
const app = express();
const port = 3000;

app.get("/", async (req, res) => {
  res.send("Hello, world");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
