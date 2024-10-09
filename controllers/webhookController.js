const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const CourseSaleHistory = require('../models/courseSaleHistoryModel');
const Enroll = require('../models/enrollModel');

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

exports.webhookEnrollmentCheckout = (req, res, next) => {
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
    const { courseId, instructorId, customerId } = session.metadata;

    createCourseSaleHistory(
      courseId,
      instructorId,
      customerId,
      session.amount_total / 100,
    );
    createEnrollment(courseId, customerId);

    console.log(`Payment completed for session: ${session.id}`);
  }
  res.status(200).json({ received: true });
};
