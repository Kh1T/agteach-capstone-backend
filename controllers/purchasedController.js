const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const REDIRECT_DOMAIN = 'https://agteach.site';

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
        unit_amount: item.price * 100,
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
