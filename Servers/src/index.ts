const express = require("express");
const cors = require("cors");
const userRouter = require("./routes/users.route");

const app = express();
const port = 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/users", userRouter);

app.listen(port, () => {
  console.log(`Server running on port http://localhost:${port}/`);
});
