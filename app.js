const morgan = require("morgan");
const express = require("express");
const cors = require("cors");
const globalErrorHandler = require("./controllers/errorController");

const app = express();

// Routes

const userRouter = require("./routes/userRoutes");

app.use(express.json());
app.use(cors());
app.use(morgan());

// Routes

app.use("/api/users", userRouter);
app.use(globalErrorHandler);

module.exports = app;
