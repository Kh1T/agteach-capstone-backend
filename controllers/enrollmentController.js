const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { col, Op, fn } = require('sequelize');
const catchAsync = require('../utils/catchAsync');
const Course = require('../models/courseModel');
const Customer = require('../models/customerModel');
const CourseSaleHistory = require('../models/courseSaleHistoryModel');
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
    return next(new AppError('Customer not found', 404));
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
    return next(new AppError('Course Not Found', 404));
  }

  const customer = await Customer.findOne({
    where: { userUid: userUid },
    attribute: ['customerId'],
  });

  if (!customer) {
    return next(new AppError('Customer not found', 404));
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
      type: 'course',
      courseId: courseId,
      instructorId: instructorId,
      customerId: customer.customerId,
    },
    success_url: `${REDIRECT_DOMAIN}/success-payment?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${REDIRECT_DOMAIN}/fail-payment`,
  });
  res.status(200).json({ status: 'success', id: session.id });
});

exports.getEnrollment = catchAsync(async (req, res, next) => {
  const { instructorId } = req.memberData;
  const { name, order = 'ASC' } = req.query;

  // Validate the order parameter to only allow 'ASC' or 'DESC'
  const sortOrder = ['DESC', 'ASC'].includes(order.toUpperCase())
    ? order.toUpperCase()
    : 'ASC';

  const courseSaleHistory = await CourseSaleHistory.findAll({
    where: { $name$: { [Op.iLike]: `%${name}%` } },
    include: [{ model: Course, where: { instructorId }, attributes: [] }],
    attributes: [
      [col('course.course_id'), 'courseId'],
      [col('course.name'), 'CourseName'],
      [col('course.price'), 'price'],
      [col('course.created_at'), 'CreatedAt'],
      [fn('COUNT', col('course.course_id')), 'student'],
    ],
    group: ['course.course_id', 'course.name', 'course.created_at'],
    order: [[col('course.created_at'), sortOrder]], // Sort by course.created_at
    raw: true,
  });

  res.status(200).json({ status: 'success', courseSaleHistory });
});
