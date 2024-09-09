const express = require("express");
const cors = require("cors");
const app = express();

const ProductCategory = require("./models/ProductCategory");
const UserAccount = require("./models/UserAccount");

const userRouter = require("./routes/userRoutes");

app.use(express.json());
app.use(cors());

// Routes
app.use("/users", userRouter);

module.exports = app;
