const { Op } = require('sequelize');
const Product = require('../models/productModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * @description Fetches cart items by product IDs from the database.
 * @function getCartItems
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Promise<void>}
 */
exports.getCartItems = catchAsync(async (req, res, next) => {
  const cartItems = req.body;

  // Fetch product IDs from the cart items
  const productIds = [...new Set(cartItems.map((item) => item.productId))];

  // Fetch products from the database by IDs
  const products = await Product.findAll({
    where: {
      productId: {
        [Op.in]: productIds,
      }, // Fetch products by their IDs
    },
    attributes: ['productId', 'name', 'imageUrl', 'price', 'quantity'],
  });

  // Create a map for quick product lookup
  const productMap = new Map(
    products.map((product) => [product.productId, product]),
  );

  let status = 'success';
  let statusCode = 200;
  let message = 'Cart items fetched successfully';

  // Map cart items with correct prices from the database
  const items = cartItems.map((item) => {
    const product = productMap.get(item.productId);

    if (!product) {
      status = 'fail';
      message = 'Product not found';
      statusCode = 404;
      return;
    }

    if (item.quantity > product.quantity) {
      status = 'fail';
      message = 'Not enough quantity in stock';
      statusCode = 404;
      return;
    }

    return {
      productId: product.productId,
      name: product.name,
      imageUrl: product.imageUrl,
      price: parseFloat(product.price),
      quantity: item.quantity,
    };
  });

  if (productIds.length !== items.length) {
    return next(new AppError('Some products not found', 404));
  }

  res.status(statusCode).json({ status, message, items });
});
