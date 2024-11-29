const { col, fn, Op } = require('sequelize');
const UserAccount = require('../models/userModel');
const Instructor = require('../models/instructorModel');
const Location = require('../models/locationModel');
const Course = require('../models/courseModel');
const Product = require('../models/productModel');

const factory = require('./handlerFactory');
const { uploadProfileImage } = require('../utils/multerConfig');
const { resizeUploadProfileImage } = require('../utils/uploadMiddleware');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const PurchasedDetail = require('../models/purchasedDetailModel');
const CourseSaleHistory = require('../models/courseSaleHistoryModel');
const Customer = require('../models/customerModel');
const ProductSaleHistory = require('../models/productSaleHistoryModel');

const {
  getInstructorOverviewSales,
  getInstructorProductTopSales,
  getInstructorCourseTopSales,
} = require('../utils/findTopSales');

exports.fetchInstructor = factory.fetchMemberData(Instructor, ['instructorId']);

/**
 * @description Gets additional user account information, including instructor details and location.
 * @async
 * @function getAdditionalInfo
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Promise<void>}
 */
exports.getAdditionalInfo = factory.getOne(UserAccount, {
  include: [
    {
      model: Instructor,
      attributes: [
        'email',
        'phone',
        'address',
        'firstName',
        'lastName',
        'dateOfBirth',
        'imageUrl',
        'bio',
        'isApproved',
        'isFormSubmitted',
        'isRejected',
      ],
      include: {
        model: Location,
        attributes: ['locationId', 'name'],
      },
    },
  ],
});

/**
 * @description Uploads a single profile image.
 * @function uploadProfile
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.uploadProfile = uploadProfileImage.single('photo');

/**
 * @description Resizes the uploaded profile image.
 * @function resizeProfile
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.resizeProfile = resizeUploadProfileImage;

/**
 * @description Adds additional information to the instructor profile.
 * @async
 * @function addAdditionalInfo
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.addAdditionalInfo = factory.additionalInfo(Instructor);

/**
 * @description Updates the current instructor's profile.
 * @async
 * @function updateMe
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.updateMe = factory.updateMe(Instructor);

/**
 * @description Retrieves detailed information about a specific instructor.
 * @async
 * @function getInstructorDetail
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Promise<void>}
 * @throws {AppError} If the instructor is not found.
 */
exports.getInstructorDetail = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const [instructor, courses, products] = await Promise.all([
    Instructor.findByPk(id),
    Course.findAll({ where: { instructorId: id } }),
    Product.findAll({ where: { instructorId: id } }),
  ]);

  if (!instructor) {
    return next(new AppError("This Instructor Doesn't exist", 404));
  }

  res.status(200).json({
    status: 'success',
    instructor,
    courses,
    products,
  });
});

/**
 * @description Gets instructor data for the currently logged-in instructor.
 * @async
 * @function getInstructorData
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Promise<void>}
 * @throws {AppError} If the instructor is not found.
 */
exports.getInstructorData = catchAsync(async (req, res, next) => {
  // Fetch instructor data
  const instructor = await Instructor.findOne({
    where: { user_uid: req.user.userUid },
  });

  if (!instructor) {
    return new AppError('Instructor not found', 404);
  }

  // Respond with the instructor data
  res.status(200).json({
    status: 'success',
    data: instructor,
  });
});

/**
 * @description Get the balance of an instructor.
 * @async
 * @function getBalance
 * @param {Object} req - Express request object.
 * @param {Object} req.memberData - Instructor data from middleware.
 * @param {number} req.memberData.instructorId - The ID of the instructor.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Promise<void>}
 */
exports.getBalance = catchAsync(async (req, res, next) => {
  const { instructorId } = req.memberData;
  //
  //  const instructorId = 75;
  const purchasedDetail = await PurchasedDetail.sum('total', {
    include: [
      {
        model: Product,
        attributes: [],
        where: {
          instructorId,
        },
      },
    ],
    group: ['product.instructor_id'], // Group by instructor_id
  });
  const courseSaleHistory = await CourseSaleHistory.sum(
    'course_sale_history.price',
    {
      include: [
        {
          model: Course,
          attributes: [],
          where: {
            instructorId,
          },
        },
      ],
      group: ['course.instructor_id'], // Group by instructor_id
    },
  );
  res.status(200).json({
    status: 'success',
    data: { course: courseSaleHistory, product: purchasedDetail },
  });
});

/**
 * @description Retrieves all product balances for an instructor.
 * @async
 * @function getAllProductBalance
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Promise<void>}
 */
exports.getAllProductBalance = catchAsync(async (req, res, next) => {
  const { instructorId } = req.memberData;
  const { name, order } = req.query;

  const productSaleHistory = await ProductSaleHistory.findAll({
    where: {
      instructorId,
      ...(name && { $name$: { [Op.iLike]: `%${name}%` } }),
    },
    include: [
      { model: PurchasedDetail, attributes: [] },
      { model: Product, attributes: [] },
      { model: Customer, attributes: [] },
    ],
    attributes: [
      [fn('DATE', col('product_sale_history.created_at')), 'date'],
      [col('product.name'), 'productName'],
      [
        fn(
          'concat',
          col('customer.first_name'),
          ' ',
          col('customer.last_name'),
        ),
        'customerName',
      ],
      [col('purchased_detail.quantity'), 'quantity'],
      [col('purchased_detail.price'), 'price'],
      [col('purchased_detail.total'), 'purchasedPrice'],
    ],
    order: [[col('product_sale_history.created_at'), order || 'DESC']],
    raw: true,
  });

  res.status(200).json({
    status: 'success',
    data: productSaleHistory,
  });
});

/**
 * @description Retrieves all course balances for an instructor with pagination.
 * @async
 * @function getAllCourseBalance
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Promise<void>}
 */
exports.getAllCourseBalance = catchAsync(async (req, res, next) => {
  const { instructorId } = req.memberData;
  const { name, order, page = 1, pageSize = 10 } = req.query;
  const limit = parseInt(pageSize, 10); // Number of items per page
  const offset = (page - 1) * limit; // Calculate the offset

  const courseSaleHistory = await CourseSaleHistory.findAll({
    where: {
      instructorId,
      ...(name && { $name$: { [Op.iLike]: `%${name}%` } }),
    },
    include: [
      { model: Customer, attributes: [] },
      { model: Course, attributes: [] },
    ],
    attributes: [
      [fn('DATE', col('course_sale_history.created_at')), 'date'],
      [col('course.name'), 'courseName'],
      [
        fn(
          'concat',
          col('customer.first_name'),
          ' ',
          col('customer.last_name'),
        ),
        'customerName',
      ],
      [col('course_sale_history.price'), 'salePrice'],
    ],
    order: [[col('course_sale_history.created_at'), order || 'DESC']],
    limit, // Apply the limit for pagination
    offset, // Apply the offset for pagination
    raw: true,
  });

  res.status(200).json({
    status: 'success',
    data: courseSaleHistory,
  });
});

/**
 * @description Gets recent transactions for an instructor.
 * @async
 * @function getRecentTransations
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Promise<void>}
 */
exports.getRecentTransations = catchAsync(async (req, res, next) => {
  const { instructorId } = req.memberData;

  const courseSaleHistory = await CourseSaleHistory.findAll({
    where: { instructorId },
    include: [{ model: Customer, attributes: [] }],
    attributes: [
      [fn('DATE', col('course_sale_history.created_at')), 'date'],
      [col('customer.last_name'), 'name'],
      'price',
    ],
    order: [[col('course_sale_history.created_at'), 'DESC']], // Order by created_at in descending order
    limit: 5,
    raw: true, // Return plain objects instead of Sequelize models
  });
  const productSaleHistory = await ProductSaleHistory.findAll({
    where: { instructorId },
    include: [
      { model: Customer, attributes: [] },
      { model: PurchasedDetail, attributes: [] },
    ],
    attributes: [
      [fn('DATE', col('product_sale_history.created_at')), 'date'],
      [col('customer.last_name'), 'name'],
      [col('purchased_detail.total'), 'price'],
    ],
    order: [[col('product_sale_history.created_at'), 'DESC']], // Order by created_at in descending order
    limit: 5,
    raw: true, // Return plain objects instead of Sequelize models
  });

  res.status(200).json({
    status: 'success',
    data: { course: courseSaleHistory, product: productSaleHistory },
  });
});

/**
 * @description Retrieves overview sales data for an instructor.
 * @async
 * @function getInstructorOverviewSales
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Promise<void>}
 */
exports.getInstructorOverviewSales = catchAsync(async (req, res, next) => {
  const { instructorId } = req.memberData;
  const instructorOverviewSales =
    await getInstructorOverviewSales(instructorId);

  res.status(200).json({
    status: 'success',
    length: instructorOverviewSales.length,
    data: instructorOverviewSales,
  });
});

/**
 * @description Retrieves top selling products for an instructor.
 * @async
 * @function getInstructorProductTopSales
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Promise<void>}
 */
exports.getInstructorProductTopSales = catchAsync(async (req, res, next) => {
  const { instructorId } = req.memberData;
  const productTopSales = await getInstructorProductTopSales(instructorId);

  res.status(200).json({
    status: 'success',
    length: productTopSales.length,
    data: productTopSales,
  });
});

/**
 * @description Retrieves top selling courses for an instructor.
 * @async
 * @function getInstructorCourseTopSales
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Promise<void>}
 */
exports.getInstructorCourseTopSales = catchAsync(async (req, res, next) => {
  const { instructorId } = req.memberData;
  const courseTopSales = await getInstructorCourseTopSales(instructorId);

  res.status(200).json({
    status: 'success',
    length: courseTopSales.length,
    data: courseTopSales,
  });
});

/**
 * @description Add verification data for an instructor.
 * @async
 * @function addVerificationData
 * @param {Object} req - Express request object.
 * @param {Object} req.memberData - Instructor data from middleware.
 * @param {number} req.memberData.instructorId - The ID of the instructor.
 * @param {Object} req.body - Request body containing verification data.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Promise<void>}
 * @throws {AppError} If the instructor is not found (404).
 */
exports.addVerificationData = catchAsync(async (req, res, next) => {
  const { instructorId } = req.memberData;

  if (!instructorId) {
    return next(new AppError('User does not exist', 404));
  }

  const instructor = await Instructor.update(
    { isFormSubmitted: true, ...req.body },
    {
      where: { instructorId },
    },
  );

  res.status(200).json({
    status: 'success',
    message: 'The Form has been sumbit',
  });
});
