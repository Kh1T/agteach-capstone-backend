const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const catchAsync = require('../utils/catchAsync');
const Course = require('../models/courseModel');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const { courseId } = req.body;
  const course = await Course.findByPk(courseId);

  if (!course) {
    return res.status(404).json({
      error: 'Course Not Found',
    });
  }

  const { name, price, thumbnailUrl } = course;

  //TODO: Will Change to req.user.email
  // const userEmail = 'mifima8598@adambra.com';

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: name,
            images: [thumbnailUrl],
          },
          unit_amount: price * 100, // amount in cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: 'http://localhost:3000/success',
    cancel_url: 'http://localhost:3000/cancel',
  });
  res.status(200).json({ id: session.id });
});
