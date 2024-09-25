const catchAsync = require('../utils/catchAsync');
const Product = require('../models/productModel');
// const { get, all } = require('../routes/userRoutes');

// const allProduct = allProduct.get('name', 'price', 'instructor', 'image');

exports.getAll = catchAsync(async (req, res, next) => {
  const allProduct = await Product.findAll();

  res.status(200).json({
    status: 'success',
    results: allProduct.length,
    allProduct,
  });
});
