const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

/**
 * Retrieves a Stripe payment session and its payment intent.
 * @function getPaymentSession
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Promise<void>}
 */
exports.getPaymentSession = catchAsync(async (req, res, next) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return next(new AppError('Session Id not found', 404));
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  const paymentIntent = await stripe.paymentIntents.retrieve(
    session.payment_intent,
  );

  res.status(200).json({
    status: 'success',
    session,
    paymentIntent,
  });
});
