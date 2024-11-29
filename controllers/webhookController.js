const { Op } = require('sequelize');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const CourseSaleHistory = require('../models/courseSaleHistoryModel');
const Enroll = require('../models/enrollModel');
const Product = require('../models/productModel');
const ProductSaleHistory = require('../models/productSaleHistoryModel');
const PurchasedDetail = require('../models/purchasedDetailModel');
const Purchased = require('../models/purchasedModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendPaymentEmail = require('../utils/sendPaymentEmail');
const generateEnrollmentEmailContent = require('../utils/enrollmentEmailContent');
const generatePurchasedEmailContent = require('../utils/purchasedEmailContent');

/**
 * Create a Course Sale History record in the DB.
 * @param {number} courseId - course ID
 * @param {number} instructorId - instructor ID
 * @param {number} customerId - customer ID
 * @param {number} price - price of course
 */
const createCourseSaleHistory = async (
  courseId,
  instructorId,
  customerId,
  price,
) => {
  await CourseSaleHistory.create({
    courseId,
    instructorId,
    customerId,
    price,
  }).catch((err) => console.log(`Something went wrong: ${err}`));
};
/**
 * Create enrollment record in DB.
 * @param {number} courseId - ID of Course enrolled in
 * @param {number} customerId - ID of Customer enrolled in
 */
const createEnrollment = async (courseId, customerId) => {
  await Enroll.create({ courseId, customerId }).catch((err) =>
    console.log(`Something went wrong: ${err}`),
  );
};

/**
 * Create a Product Sale History record in the DB.
 * @param {number} productId - product ID
 * @param {number} customerId - customer ID
 * @param {number} purchasedDetailId - Purchased Detail ID
 * @param {number} instructorId - instructor ID
 * @param {boolean} isDelivered - set to false initially and
 * set to true when the product is delivered
 */
const createProductSaleHistory = async (
  productId,
  customerId,
  purchasedDetailId,
  instructorId,
  purchasedId,
) => {
  await ProductSaleHistory.create({
    productId,
    customerId,
    purchasedDetailId,
    instructorId,
    isDelivered: false, // Set to true upon delivery
    purchasedId,
  }).catch((err) => console.log(`Something went wrong: ${err}`));
};

/**
 * Handles Stripe Webhooks
 * @module controllers/webhookController
 */

/**
 * Enrollment controller
 * @namespace controllers/enrollmentController
 */

/**
 * Handles Stripe Webhooks
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.webhookEnrollmentCheckout = catchAsync(async (req, res, next) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.log('Webhook signature verification failed', err);
    return res.status(400).send(`Webhook Error: ${err}`);
  }
  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const customerEmail = session.customer_details.email;

    if (session.metadata.type === 'course') {
      const { courseId, instructorId, customerId } = session.metadata;

      createCourseSaleHistory(
        courseId,
        instructorId,
        customerId,
        session.amount_total / 100,
      );

      createEnrollment(courseId, customerId);

      const content = generateEnrollmentEmailContent(courseId);
      await sendPaymentEmail({ email: customerEmail, content, subject: 'Course Enrolled Successfully - AgTeach' });
    }
    if (session.metadata.type === 'product') {
      const { customerId } = session.metadata;
      const lineItems = await stripe.checkout.sessions.listLineItems(
        session.id,
        {
          expand: ['data.price.product'],
        },
      );

      // Fetch productId and quantity from the lineItems
      const productUpdates = lineItems.data.map((item) => ({
        productId: item.price.product.metadata.product_id,
        quantity: item.quantity,
        name: item.price.product.name,
        imageUrl: item.price.product.images[0],
        price: item.price.unit_amount / 100,
      }));

      // Get only the product IDs from the productUpdates
      const productIds = productUpdates.map((item) => item.productId);

      // Fetch products from the database by IDs
      const products = await Product.findAll({
        where: {
          productId: {
            [Op.in]: productIds,
          },
        },
      });

      // Calculate the new quantity for each product
      const insufficientStock = [];
      const updates = products.map((product) => {
        // Find the product in the productUpdates
        const lineItem = productUpdates.find(
          (item) => Number(item.productId) === product.dataValues.productId,
        );

        const newQuantity = product.quantity - lineItem.quantity;

        // Check if the new quantity is less than 0
        if (newQuantity < 0) {
          insufficientStock.push(product.productId);
        }
        return {
          productId: product.productId,
          newQuantity,
        };
      });

      // If there are insufficient stock, return an error
      if (insufficientStock.length > 0) {
        return next(new AppError('Insufficient stock', 400));
      }

      // Update the quantity for each product
      await Promise.all(
        updates.map(async ({ productId, newQuantity }) => {
          await Product.update(
            { quantity: newQuantity },
            { where: { productId } },
          );
        }),
      );

      // Create a purchase record for the transaction
      const purchased = await Purchased.create({
        customerId,
        total: session.amount_total / 100,
      });

      // Iterate over each purchased product
      await Promise.all(
        lineItems.data.map(async (item) => {
          const productId = item.price.product.metadata.product_id;
          const price = item.price.unit_amount / 100; // Convert from cents to dollars
          const total = price * item.quantity;

          // Create a purchase detail entry for each product
          const purchasedDetail = await PurchasedDetail.create({
            purchasedId: purchased.purchasedId,
            productId: productId,
            quantity: item.quantity,
            price: price,
            total: total,
          });

          // Find the product's instructor
          const { instructorId } = await Product.findByPk(productId);

          // Create an entry in product_sale_history
          createProductSaleHistory(
            productId,
            customerId,
            purchasedDetail.purchasedDetailId,
            instructorId,
            purchased.purchasedId,
          );
        }),
      );

      const totalAmount = session.amount_total / 100;
      const content = generatePurchasedEmailContent(productUpdates, totalAmount);
      await sendPaymentEmail({ email: customerEmail, content, subject: 'Payment Successfully - AgTeach' });
      console.log(`Product Payment completed`);
    }
  }
  res.status(200).json({ received: true });
});
