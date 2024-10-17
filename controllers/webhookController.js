const { Op } = require('sequelize');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const CourseSaleHistory = require('../models/courseSaleHistoryModel');
const Enroll = require('../models/enrollModel');
const Product = require('../models/productModel');
const ProductSaleHistory = require('../models/productSaleHistoryModel');
const PurchasedDetail = require('../models/purchasedDetailModel');
const Purchased = require('../models/purchasedModel');
const catchAsync = require('../utils/catchAsync');

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
) => {
  await ProductSaleHistory.create({
    productId,
    customerId,
    purchasedDetailId,
    instructorId,
    isDelivered: false, // Set to true upon delivery
  }).catch((err) => console.log(`Something went wrong: ${err}`));
};

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
    if (session.metadata.type === 'course') {
      const { courseId, instructorId, customerId } = session.metadata;

      createCourseSaleHistory(
        courseId,
        instructorId,
        customerId,
        session.amount_total / 100,
      );
      createEnrollment(courseId, customerId);

      console.log(`Course Payment completed for session: ${session.id}`);
    }
    if (session.metadata.type === 'product') {
      const { customerId } = session.metadata;
      const lineItems = await stripe.checkout.sessions.listLineItems(
        session.id,
        {
          expand: ['data.price.product'],
        },
      );

      const productUpdates = lineItems.data.map((item) => ({
        productId: item.price.product.metadata.product_id,
        quantity: item.quantity,
      }));

      console.log("I'm [productUpdates] checking here: ", productUpdates);

      const productIds = productUpdates.map((item) => item.productId);

      console.log("I'm checking [productIds] here: ", productIds);
      const products = await Product.findAll({
        where: {
          productId: {
            [Op.in]: productIds,
          },
        },
      });

      console.log("I'm checking [products] here: ", products);

      const insufficientStock = [];
      const updates = products.map((product) => {
        console.log("I'm checking [Single product] here: ", product);
        const lineItem = productUpdates.find(
          (item) => Number(item.productId)=== product.dataValues.productId,
        );

        console.log("I'm checking [lineItem] here: ", lineItem);

        const newQuantity = product.quantity - lineItem.quantity;

        console.log("I'm checking [newQuantity] here: ", newQuantity);

        if (newQuantity < 0) {
          insufficientStock.push(product.productId);
        }
        return {
          productId: product.productId,
          quantity: newQuantity,
        };
      });

      console.log("I'm checking [updates] here: ", updates);
      

      if (insufficientStock.length > 0) {
        return res
          .status(400)
          .json({ status: 'fail', message: 'Insufficient stock' });
      }

      await Promise.all(
        updates.map(({ productId, newQuantity }) =>
          Product.update({ quantity: newQuantity }, { where: { productId } }),
        ),
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
          );
        }),
      );

      console.log(`Product Payment completed: ${session.id}`);
    }
  }
  res.status(200).json({ received: true });
});
