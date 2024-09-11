const morgan = require("morgan");
const express = require("express");
const cors = require("cors");
const globalErrorHandler = require("./controllers/errorController");

const app = express();

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Routes

const userRouter = require("./routes/userRoutes");

app.use(express.json());
app.use(cors());

// Routes

app.use("/api/users", userRouter);
app.use(globalErrorHandler);

module.exports = app;
