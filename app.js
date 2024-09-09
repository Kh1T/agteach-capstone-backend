const express = require("express");
const cors = require("cors");
const app = express();
const ProductCategory = require("./models/ProductCategory");

app.use(cors());

app.get("/", async (req, res) => {
  const product = await ProductCategory.findAll();
  res.status(200).json({
    status: "success",
    data: product,
  });
});

module.exports = app;
