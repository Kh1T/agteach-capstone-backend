const express = require("express");
const cors = require("cors");

const app = express();

const ProductCategory = require("./models/ProductCategory");
const UserAccount = require("./models/UserAccount");
const userRoutes = require("./routes/userRoutes");

app.use(express.json());
app.use(cors());

// app.get("/", async (req, res) => {
//   console.log(process.env.HOST_DB);
//   const product = await UserAccount.findAll();
//   res.status(200).json({
//     status: "success",
//     data: product,
//   });
// });

app.post("/create", async (req, res) => {
  const createItem = await ProductCategory.create(req.body);
  res.json({
    status: "success",
    data: createItem,
  });
});

// Routes
app.use("/users", userRoutes);

module.exports = app;
