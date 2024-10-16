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
  // const { instructorId } = req.memberData;
const instructorId = 61
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
  const courseSaleHistory = await CourseSaleHistory.sum('course_sale_history.price', {
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
  });
  res.status(200).json({
    status: 'success',
    data: { course: purchasedDetail, product: courseSaleHistory },
  });
});

