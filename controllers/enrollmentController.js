const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const catchAsync = require('../utils/catchAsync');
const Course = require('../models/courseModel');
const Customer = require('../models/customerModel');

const REDIRECT_DOMAIN = 'https://agteach.site';

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const { courseId } = req.body;
  const course = await Course.findByPk(courseId);

  //Check if the course exists
  if (!course) {
    return res.status(404).json({
      error: 'Course Not Found',
    });
  }

  const { name, price, thumbnailUrl, instructorId } = course;

  // Get user email from req.user (set by authController.protect)
  const userEmail = req.user.email;
  const userId = req.user.userUid;

  // const customer = await Customer.findOne({
  //   where: { userId },
  //   attribute: ['customerId'],
  // });

  // if (!customer) {
  //   console.log('Customer not found');
  //   return null;
  // }

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
    customer_email: userEmail,
    client_reference_id: userId,
    mode: 'payment',
    metadata: {
      courseId: courseId,
      instructorId: instructorId,
      // customerId: customer.customerId,
    },
    success_url: `${REDIRECT_DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${REDIRECT_DOMAIN}/cancel`,
  });
  res.status(200).json({ id: session.id });
});
