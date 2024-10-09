const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createCourseSaleHistory = () => {};

const createEnrollment = () => {};

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

    console.log(
      `Payment completed for session: ${session.id} ${courseId} ${instructorId} ${customerId}`,
    );
  }
  res.status(200).json({ received: true });
};
