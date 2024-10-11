const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const CourseSaleHistory = require('../models/courseSaleHistoryModel');
const Enroll = require('../models/enrollModel');
const Product = require('../models/productModel');
const ProductSaleHistory = require('../models/productSaleHistoryModel');
const PurchasedDetail = require('../models/purchasedDetailModel');
const Purchased = require('../models/purchasedModel');

const createCourseSaleHistory = async (
  courseId,
  instructorId,
  customerId,
  price,
) => {
  try {
    await CourseSaleHistory.create({
      courseId,
      instructorId,
      customerId,
      price,
    });
  } catch (err) {
    console.log(`Somethin went wrong: ${err}`);
  }
};

const createEnrollment = async (courseId, customerId) => {
  try {
    await Enroll.create({
      courseId,
      customerId,
    });
  } catch (err) {
    console.log(`Somethin went wrong: ${err}`);
  }
};

exports.webhookEnrollmentCheckout = async (req, res, next) => {
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

      // Create a purchase record for the transaction
      const purchased = await Purchased.create({
        customerId: customerId,
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
          const product = await Product.findByPk(productId);

          // Create an entry in product_sale_history
          await ProductSaleHistory.create({
            productId: productId,
            customerId: customerId,
            purchasedDetailId: purchasedDetail.purchasedDetailId,
            instructorId: product.instructorId,
            isDelivered: false, // Set to true upon delivery
          });
        }),
      );

      console.log(`Product Payment completed: ${session.id}`);
    }
  }
  res.status(200).json({ received: true });
};
