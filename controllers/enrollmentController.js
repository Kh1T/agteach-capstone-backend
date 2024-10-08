const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const catchAsync = require('../utils/catchAsync');

const YOUR_DOMAIN = 'https://agteach.site';

exports.getCheckoutSession = catchAsync(async (req, res, next) => {

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price: 10 * 100,
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${YOUR_DOMAIN}?success=true`,
    cancel_url: `${YOUR_DOMAIN}?canceled=true`,
  });

  res.redirect(303, session.url);

});

