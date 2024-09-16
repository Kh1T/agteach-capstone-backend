const morgan = require("morgan");
const express = require("express");
const cors = require("cors");
const globalErrorHandler = require("./controllers/errorController");

const authController = require("./controllers/authController");

const app = express();

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Routes

const userRouter = require("./routes/userRoutes");

app.use(express.json());
app.use(cors({credentials: true, origin: 'http://localhost:3000'}));

// Routes
app.use("/api/users", userRouter);

app.use(globalErrorHandler);

module.exports = app;
