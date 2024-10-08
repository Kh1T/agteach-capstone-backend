const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.post(
  '/stripe-webhook',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    const sig = req.header['stripe-signature'];

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
      console.log(`Payment completed for session: ${session.id}`);
    }
    res.status(200).json({ received: true });
  },
);

module.exports = router;
