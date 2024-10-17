const UserAccount = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const handleFactory = require('./handlerFactory');
const Instructor = require('../models/instructorModel');
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const Course = require('../models/courseModel');
const enroll = require('../models/enrollModel');
const ProductSaleHistory = require('../models/productSaleHistoryModel');
const CourseSaleHistory = require('../models/courseSaleHistoryModel');
const PurchasedDetail = require('../models/purchasedDetailModel');

exports.getAdminInfo = catchAsync(async (req, res, next) => {
  const { role } = req.user;
  if (role !== 'admin') {
    return res.status(403).json({
      status: 'fail',
      message:
        'Access denied. You are not authorized to view this information.',
    });
  }

  const admin = await UserAccount.findOne({
    where: {
      userUid: req.user.userUid,
      role: 'admin',
    },
  });

  if (!admin) {
    return res.status(404).json({
      status: 'fail',
      message: 'Admin not found.',
    });
  }

  res.status(200).json({
    status: 'success',
    data: admin,
  });
});

exports.getAllInstructor = handleFactory.getAll(Instructor);

//Categories
exports.getCategory = handleFactory.getOne(Category);
exports.getAllCategories = handleFactory.getAll(Category);

exports.createCategory = catchAsync(async (req, res, next) => {
  console.log({ reqBody: req.body });
  try {
    const category = await Category.create(req.body);
    console.log({ category });
    res.status(201).json({
      status: 'success',
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});
exports.updateCategory = catchAsync(async (req, res, next) => {
  const category = await Category.update(req.body, {
    where: {
      categoryId: req.params.id,
    },
  });

  res.status(200).json({
    status: 'success',
    data: category,
  });
});
exports.deleteCategory = handleFactory.deleteOne(Category);

// Top 5 Sales
const {
  getProductSalesTotals,
  getCourseTopSales,
} = require('../utils/findTopSales');

exports.getProductTopSales = catchAsync(async (req, res, next) => {
  const uniqueSalesTotals = await getProductSalesTotals(
    ProductSaleHistory,
    'product_id',
    PurchasedDetail,
  );

  res.status(200).json({
    status: 'success',
    salesProductTotals: uniqueSalesTotals,
  });
});

exports.getCourseTopSales = catchAsync(async (req, res, next) => {
  const salesCourseTotals = await getCourseTopSales();

  return res.status(200).json({
    status: 'success',
    salesCourseTotals,
  });
});
