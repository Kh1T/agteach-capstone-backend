const UserAccount = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const handleFactory = require('./handlerFactory');
const Instructor = require('../models/instructorModel');
const Customer = require('../models/customerModel');
const Category = require('../models/categoryModel');

const {
  getProductSalesTotals,
  getCourseTopSales,
  getSalesOverview,
} = require('../utils/findTopSales');

exports.getAdminInfo = catchAsync(async (req, res, next) => {
  const admin = await UserAccount.findOne({
    where: {
      role: 'admin',
      userUid: req.user.userUid,
    },
  });
  res.status(200).json({
    status: 'success',
    data: admin,
  })
});

exports.getAllInstructor = handleFactory.getAll(Instructor);
exports.getAllCustomers = handleFactory.getAll(Customer);

//Categories
exports.getCategory = handleFactory.getOne(Category);
exports.getAllCategories = handleFactory.getAll(Category);
exports.searchCategory = handleFactory.SearchData(Category);

exports.createCategory = catchAsync(async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
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

// Dashboard
exports.getProductTopSales = catchAsync(async (req, res, next) => {
  const salesProductTotals = await getProductSalesTotals();

  res.status(200).json({
    status: 'success',
    salesProductTotals,
  });
});

exports.getCourseTopSales = catchAsync(async (req, res, next) => {
  const salesCourseTotals = await getCourseTopSales();

  return res.status(200).json({
    status: 'success',
    salesCourseTotals,
  });
});

exports.getSalesOverview = catchAsync(async (req, res, next) => {
  const salesData = await getSalesOverview();
  return res.status(200).json({
    status: 'success',
    salesData,
  });
});
