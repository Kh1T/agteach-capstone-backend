const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const catchAsync = require('../utils/catchAsync');
const Course = require('../models/courseModel');
const Customer = require('../models/customerModel');
const Enroll = require('../models/enrollModel');
const AppError = require('../utils/appError');

const REDIRECT_DOMAIN = 'https://agteach.site';

exports.checkEnrollment = catchAsync(async (req, res, next) => {
  const { courseId } = req.body;

  const userId = req.user.userUid;

  const customer = await Customer.findOne({
    where: { userUid: userId },
    attribute: ['customerId'],
  });

  if (!customer) {
    return AppError('Customer not found', 404);
  }

  const isEnrolled = await Enroll.findOne({
    where: { courseId, customerId: customer.customerId },
  });

  if (isEnrolled) {
    return res.status(200).json({
      message: 'You are already enrolled in this course.',
      redirectUrl: `/courses/${courseId}/watch`,
    });
  }
  next();
});

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const { courseId } = req.body;
  // Get user email from req.user (set by authController.protect)
  const { email, userUid } = req.user;

  const course = await Course.findByPk(courseId);

  //Check if the course exists
  if (!course) {
    return AppError('Course Not Found', 404);
  }

  const customer = await Customer.findOne({
    where: { userUid: userUid },
    attribute: ['customerId'],
  });

  if (!customer) {
    return res.status(404).json({
      error: 'Customer not found',
    });
  }

  const { name, price, thumbnailUrl, instructorId } = course;

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
    customer_email: email,
    client_reference_id: userUid,
    mode: 'payment',
    metadata: {
      courseId: courseId,
      instructorId: instructorId,
      customerId: customer.customerId,
    },
    success_url: `${REDIRECT_DOMAIN}/success-payment?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${REDIRECT_DOMAIN}/fail-payment`,
  });
  res.status(200).json({ id: session.id });
});
