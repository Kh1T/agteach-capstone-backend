const Product = require('../models/productModel');
const catchAsync = require('../utils/catchAsync');

exports.getCartItems = catchAsync(async (req, res, next) => {
  const cartItems = req.body;

  // Fetch product IDs from the cart items
  const productIds = cartItems.map((item) => item.productId);

  // Fetch products from the database by IDs
  const products = await Product.findAll({
    where: {
      productId: productIds, // Fetch products by their IDs
    },
  });
  

  res.status(200).json({ status: 'success', productIds, products });
});
