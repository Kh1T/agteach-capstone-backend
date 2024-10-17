const { Sequelize, col, fn, Op } = require('sequelize');
const UserAccount = require('../models/userModel');
const Instructor = require('../models/instructorModel');
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
const Purchased = require('../models/purchasedModel');
const ProductSaleHistory = require('../models/productSaleHistoryModel');

exports.fetchInstructor = factory.fetchMemberData(Instructor, ['instructorId']);
exports.searchData = factory.SearchData(Instructor);

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
        'location_id',
        'dateOfBirth',
        'imageUrl',
      ],
    },
  ],
});

exports.uploadProfile = uploadProfileImage.single('photo');

exports.resizeProfile = resizeUploadProfileImage;

exports.addAdditionalInfo = factory.additionalInfo(Instructor);

exports.updateMe = factory.updateMe(Instructor);

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

exports.getBalance = catchAsync(async (req, res, next) => {
  const { instructorId } = req.memberData;
  //
  //  const instructorId = 75;
  const purchasedDetail = await PurchasedDetail.sum('total', {
    include: [
      {
        model: Product,
        attributes: [], // Exclude all product attributes
        where: {
          instructorId, // Use the dynamic instructorId from req.memberData
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
          attributes: [], // Exclude all product attributes
          where: {
            instructorId, // Use the dynamic instructorId from req.memberData
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

exports.getAllProductBalance = catchAsync(async (req, res, next) => {
  const { instructorId } = req.memberData;
  const { name, order } = req.query;

  const productSaleHistory = await ProductSaleHistory.findAll({
    where: {
      instructorId,
      ...(name && { $name$: { [Op.iLike]: `%${name}%` } }),
    },
    include: [
      {
        model: PurchasedDetail, // Include the Customer model
        attributes: [], // Select only the name field
      },
      {
        model: Product,
        attributes: [],
      },
      {
        model: Customer,
        attributes: [],
      },
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
      {
        model: Customer, // Include the Customer model
        attributes: [], // Select only the name field
      },
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

exports.getRecentTransations = catchAsync(async (req, res, next) => {
  const { instructorId } = req.memberData;

  const courseSaleHistory = await CourseSaleHistory.findAll({
    include: [
      {
        model: Customer, // Include the Customer model
        attributes: [], // Don't include all customer attributes, only the concatenated name
      },
    ],
    attributes: [
      [fn('DATE', col('course_sale_history.created_at')), 'date'],
      [
        fn(
          'concat',
          col('customer.first_name'),
          ' ',
          col('customer.last_name'),
        ),
        'name',
      ],
      'price',
    ],
    order: [[col('course_sale_history.created_at'), 'DESC']], // Order by created_at in descending order
    raw: true, // Return plain objects instead of Sequelize models
  });

  res.status(200).json({
    status: 'success',
    data: courseSaleHistory,
  });
});
