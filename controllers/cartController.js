const Product = require('../models/productModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getCartItems = catchAsync(async (req, res, next) => {
  const cartItems = req.body;

  // Fetch product IDs from the cart items
  const productIds = cartItems.map((item) => item.productId);

  // Fetch products from the database by IDs
  const products = await Product.findAll({
    where: {
      productId: productIds, // Fetch products by their IDs
    },
    attributes: ['productId', 'name', 'imageUrl', 'price'],
  });

  // Create a map for quick product lookup
  const productMap = new Map(
    products.map((product) => [product.productId, product]),
  );

  // Map cart items with correct prices from the database
  const items = cartItems.map((item) => {
    const product = productMap.get(item.productId);

    if (!product) {
      return next(new AppError('No product found with that ID', 404));
    }

    return {
      productId: product.productId,
      name: product.name,
      imageUrl: product.imageUrl,
      price: parseFloat(product.price),
      quantity: item.quantity,
    };
  });

  res.status(200).json({ status: 'success', items });
});
