const { fn, col, Op, QueryTypes } = require('sequelize');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Customer = require('../models/customerModel');
const ProductCategory = require('../models/productCategoryModel');
const Purchased = require('../models/purchasedModel');
const ProductSaleHistory = require('../models/productSaleHistoryModel');
const PurchasedDetail = require('../models/purchasedDetailModel');

const AppError = require('../utils/appError');
const sequelize = require('../config/db');
const catchAsync = require('../utils/catchAsync');
const Product = require('../models/productModel');
const sendEmail = require('../utils/sendEmail');
// const { raw } = require('express');

const REDIRECT_DOMAIN = 'https://alphabeez.anbschool.org';

/**
 * Creates a Stripe checkout session for a product purchase
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {function} next - Express next function
 * @returns {Promise<void>}
 */

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const { cartItems } = req.body;
  const { email, userUid } = req.user;
  const { customerId } = req.memberData;

  if (!customerId) {
    return next(new AppError('Customer not found', 404));
  }

  /**
   * Create a Stripe checkout session for a product purchase
   * @param {Object[]} cartItems - Items in the cart to purchase
   * @param {string} email - Customer email
   * @param {string} userUid - User unique identifier
   * @param {string} customerId - Customer identifier
   * @returns {Promise<Stripe.Checkout.Session>}
   */
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: cartItems.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: [item.imageUrl],
          metadata: {
            product_id: item.productId,
          },
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    })),
    customer_email: email,
    client_reference_id: userUid,
    mode: 'payment',
    metadata: {
      type: 'product',
      customerId,
    },
    success_url: `${REDIRECT_DOMAIN}/success-payment?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${REDIRECT_DOMAIN}/fail-payment`,
  });

  res.status(200).json({
    id: session.id,
    message: 'success',
  });
});

/**
 * Get all purchased products for the instructor.
 * @async
 * @function getAllPurchased
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>}
 */
exports.getAllPurchased = catchAsync(async (req, res, next) => {
  const { instructorId } = req.memberData;

  const { name, order } = req.query;
  const whereClause = { instructorId };

  if (name) {
    whereClause['$last_name$'] = { [Op.iLike]: `%${name}%` };
  }

  if (order === 'true') {
    whereClause['$is_delivered$'] = true;
  } else if (order === 'false') {
    whereClause['$is_delivered$'] = false;
  }

  const data = await ProductSaleHistory.findAll({
    include: [
      {
        model: PurchasedDetail,
        attributes: [],
      },
      { model: Customer, attributes: [] },
    ],
    attributes: [
      [fn('DATE', col('purchased_detail.created_at')), 'purchased_date'],
      'purchased_detail.purchased_id',
      'customer_id',
      [fn('SUM', col('purchased_detail.total')), 'total_sum'],
      [col('product_sale_history.is_delivered'), 'is_delivered'],
      [col('customer.last_name'), 'last_name'],
      [col('purchased_detail.purchased_id'), 'purchased_id'],
    ],

    group: [
      fn('DATE', col('purchased_detail.created_at')),
      'purchased_detail.purchased_id',
      'product_sale_history.customer_id',
      'is_delivered',
      'first_name',
      'last_name',
    ],
    where: whereClause,
  });
  res.status(200).json({ status: 'success', result: data.length, data });
});

/**
 * Retrieves all purchased products for a customer.
 * @async
 * @function getPurchaseDetail
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>}
 */
exports.getPurchaseDetail = catchAsync(async (req, res, next) => {
  const { instructorId } = req.memberData;

  const customer = await Customer.findByPk(req.query.cid);

  const purchasedDetails = await PurchasedDetail.findAll({
    where: { purchasedId: req.params.id },
    include: [
      {
        model: Product,
        where: { instructorId },
        attributes: ['productId', 'categoryId', 'name', 'price', 'imageUrl'],
        include: {
          model: ProductCategory,
          attributes: ['name'],
        },
      },
    ],
  });

  const { isDelivered } = await ProductSaleHistory.findOne({
    where: { purchasedId: req.params.id },
  });

  res
    .status(200)
    .json({ status: 'success', purchasedDetails, customer, isDelivered });
});

/**
 * Retrieves all purchased products for a customer.
 * @async
 * @function getCustomerPurchased
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>}
 */
exports.getCustomerPurchased = catchAsync(async (req, res, next) => {
  // Get customerId from the request
  const { customerId } = req.memberData;

  const purchases = await sequelize.query(
    'SELECT * FROM get_customer_purchases(:customer_id)',
    {
      replacements: { customer_id: customerId },
      type: QueryTypes.SELECT,
    },
  );

  res.status(200).json({
    status: 'success',
    result: purchases.length,
    products: purchases,
  });
});

/**
 * Updates the delivery status of a purchased product to true
 * and sends a "delivered" email to the customer.
 * @function updateDeliver
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>}
 */
exports.updateDeliver = catchAsync(async (req, res, next) => {
  const { purchasedId } = req.body;

  const productSaleHistory = await ProductSaleHistory.update(
    { isDelivered: true },
    { where: { purchasedId } },
  );
  const purchased = await Purchased.findOne({
    where: { purchasedId },
  });

  await sendEmail(req.user, {
    templateId: process.env.DELIVER_EMAIL_TEMPLATE_ID,
    subject: 'Your order has been delivered',
    customerEmail: req.body.customerEmail,
    purchased,
  });

  res.status(204).json({ status: 'success', data: productSaleHistory });
});
