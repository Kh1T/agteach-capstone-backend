const express = require("express");
const cors = require("cors");
const globalErrorHandler = require("./controllers/errorController");

const app = express();
const morgan = require("morgan");

const ProductCategory = require("./models/ProductCategory");
const UserAccount = require("./models/UserAccount");
const userRoutes = require("./routes/userRoutes");

app.use(express.json());
app.use(cors());
app.use(morgan());

// Routes

app.use(globalErrorHandler);
app.use("/api/users", userRouter);

module.exports = app;
