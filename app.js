const express = require("express");
const cors = require("cors");
const app = express();
const ProductCategory = require("./models/ProductCategory");
app.use(express.json());
app.use(cors());

app.get("/", async (req, res) => {
  const product = await ProductCategory.findAll();
  res.status(200).json({
    status: "success",
    data: product,
  });
});

app.post("/create", async (req, res) => {
  const createItem = await ProductCategory.create(req.body);

  res.json({
    status: "success",
    data: createItem,
  });
});

module.exports = app;
