const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { col, Op, fn } = require('sequelize');
const catchAsync = require('../utils/catchAsync');
const Course = require('../models/courseModel');
const Customer = require('../models/customerModel');
const Enroll = require('../models/enrollModel');
const CourseSaleHistory = require('../models/courseSaleHistoryModel');
const AppError = require('../utils/appError');
const Instructor = require('../models/instructorModel');

const REDIRECT_DOMAIN = 'https://alphabeez.anbschool.org';

/**
 * Handles Stripe Webhooks
 * @module controllers/enrollmentController
 */

/**
 * Fetches all enrollments of a customer
 * @function getUserEnrollments
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {function} next - Express next function
 * @returns {Promise<void>}
 */
exports.getUserEnrollments = catchAsync(async (req, res, next) => {
  const { customerId } = req.memberData;

  const enrollments = await Enroll.findAll({
    where: { customerId },
    include: [{ model: Course, attributes: ['courseId'] }],
  });

  const courseIds = enrollments.map((enrollment) => enrollment.courseId);

  res.status(200).json({ status: 'success', courseIds });
});

/**
 * Enrollment controller
 * @namespace controllers/enrollmentController
 */
exports.checkEnrollment = catchAsync(async (req, res, next) => {
  const { courseId } = req.body;
  const { customerId } = req.memberData;

  if (!customerId) {
    return next(new AppError('Customer not found', 404));
  }

  const isEnrolled = await Enroll.findOne({
    where: { courseId, customerId },
  });

  if (isEnrolled) {
    return res.status(200).json({
      message: 'You are already enrolled in this course.',
      redirectUrl: `/courses/${courseId}/watch/overview`,
    });
  }
  next();
});

exports.checkCourseEnroll = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { customerId } = req.memberData;

  if (!customerId) {
    return next(new AppError('Customer not found', 404));
  }

  const isEnrolled = await Enroll.findOne({
    where: { courseId: id, customerId },
  });
  if (!isEnrolled) {
    return next(new AppError('You are not enrolled in this course', 404));
  }
  next();
});

/**
 * @function getCheckoutSession
 * @description Get checkout session from stripe
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const { courseId } = req.body;
  const { email, userUid } = req.user;
  const { customerId } = req.memberData;

  const course = await Course.findByPk(courseId);

  //Check if the course exists
  if (!course) {
    return next(new AppError('Course Not Found', 404));
  }

  if (!customerId) {
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
          unit_amount: Math.round(price * 100), // amount in cents
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
      customerId,
    },
    success_url: `${REDIRECT_DOMAIN}/success-payment?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${REDIRECT_DOMAIN}/fail-payment`,
  });
  res.status(200).json({ status: 'success', id: session.id });
});

/**
 * @description Retrieves a list of enrolled courses for the instructor, sorted by course.created_at.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @property {string} name - Optional. The name of the course to search for.
 * @property {string} order - Optional. The order of the courses. Defaults to 'ASC'.
 * @returns {Promise<void>}
 */
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

/**
 * @description Retrieves enrollment details for a specific course.
 * @async
 * @function getEnrollmentDetail
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Promise<void>}
 */
exports.getEnrollmentDetail = catchAsync(async (req, res, next) => {
  const courseId = req.params.id;

  const course = await Course.findByPk(courseId);

  if (!course) {
    return next(new AppError('Course Not Found', 404));
  }

  const students = await CourseSaleHistory.findAll({
    where: { courseId },
    attributes: [
      col('customer.first_name'),
      col('customer.last_name'),
      col('customer.email'),
      col('customer.phone'),
      col('customer.image_url'),
      col('course_sale_history.price'),
      col('course_sale_history.created_at'),
    ],
    include: [
      {
        model: Customer,
        attributes: [],
      },
      {
        model: Course,
        attributes: [],
      },
    ],
    raw: true,
  });

  res.status(200).json({ status: 'success', students, course });
});

/**
 * Retrieves all enrollments of a customer.
 * @function getCustomerEnrollments
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Promise<void>}
 */
exports.getCustomerEnrollments = catchAsync(async (req, res, next) => {
  const { customerId } = req.memberData;

  const enrollments = await Enroll.findAll({
    where: { customerId },
    attributes: [
      col('course.course_id'),
      col('course.name'),
      col('course.instructor.first_name'),
      col('course.instructor.last_name'),
      col('course.thumbnail_url'),
      col('enroll.created_at'),
    ],
    include: [
      {
        model: Course,
        attributes: [],
        include: {
          model: Instructor,
          attributes: [],
        },
      },
    ],
    order: [[col('enroll.created_at'), 'DESC']],
    raw: true,
  });

  res.status(200).json({ status: 'success', enrollments });
});

