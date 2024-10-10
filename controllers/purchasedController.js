const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Customer = require('../models/customerModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const REDIRECT_DOMAIN = 'https://agteach.site';

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const { cartItems } = req.body;
  const { email, userUid } = req.user;

  const customer = await Customer.findOne({
    where: { userUid: userUid },
    attribute: ['customerId'],
  });

  if (!customer) {
    return next(new AppError('Customer not found', 404));
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: cartItems.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: [item.imageUrl],
        },
        unit_amount: item.price * 100, // amount in cents
      },
      quantity: item.quantity,
      metadata: {
        product_id: item.productId,
      },
    })),
    customer_email: email,
    client_reference_id: userUid,
    mode: 'payment',
    metadata: {
      type: 'product', // Mark the session as a product purchase
      customerId: customer.customerId,
    },
    success_url: `${REDIRECT_DOMAIN}/success-payment?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${REDIRECT_DOMAIN}/fail-payment`,
  });

  res.status(200).json({
    id: session.id,
    message: 'Hello World',
    data: {
      cartItems,
      email,
      customerId: customer.customerId,
    },
  });
});
