const express = require("express");
const app = express();
const port = 3000;

const cors = require("cors");

const userRouter = require("./routes/users.route");
const bodyParser = require("body-parser");

// Middlewares
app.use(cors());
app.use(express.json());
app.use(bodyParser.json())

// Routes
app.use("/users", userRouter);

app.listen(port, () => {
  console.log(`Server running on port http://localhost:${port}/`);
});
