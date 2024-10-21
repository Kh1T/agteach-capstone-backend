const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getPaymentSession = catchAsync(async (req, res, next) => {
  const { sessionId } = req.params;

  console.log(sessionId);

  if (!sessionId) {
    return next(new AppError('Session Id not found', 404));
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  console.log('Seesion', session)
  const paymentIntent = await stripe.paymentIntents.retrieve(
    session.payment_intent,
  );
  console.log('Payment Intent', paymentIntent)

  res.status(200).json({
    status: 'success',
    session,
    paymentIntent,
  });
});
