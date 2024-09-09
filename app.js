const express = require("express");
const cors = require("cors");
const app = express();
const morgan = require("morgan");

const userRouter = require("./routes/userRoutes");

app.use(express.json());
app.use(cors());
app.use(morgan());

// Routes
app.use("/users", userRouter);

module.exports = app;
