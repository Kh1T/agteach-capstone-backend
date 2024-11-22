/**
 * @file Controller functions for admin-related operations.
 */
const UserAccount = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const handleFactory = require('./handlerFactory');
const Instructor = require('../models/instructorModel');
const Customer = require('../models/customerModel');
const Category = require('../models/categoryModel');
const Location = require('../models/locationModel');

const {
  getProductSalesTotals,
  getCourseTopSales,
  getSalesOverview,
} = require('../utils/findTopSales');
const AppError = require('../utils/appError');

/**
 * Get information about the currently logged-in admin.
 * @async
 * @function getAdminInfo
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>}
 */
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
  });
});

/**
 * Get all instructors.
 * @async
 * @function getAllInstructor
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>}
 */
exports.getAllInstructor = catchAsync(async (req, res, next) => {
  const instructor = await Instructor.findAll({
    include: [
      {
        model: Location,
        attributes: ['locationId', 'name'],
      },
    ],
  });
  res.status(200).json({
    status: 'success',
    data: instructor,
  });
});

/**
 * Get all customers.
 * @function getAllCustomers
 */
exports.getAllCustomers = handleFactory.getAll(Customer);

//Categories
/**
 * Get a single category.
 * @function getCategory
 */
exports.getCategory = handleFactory.getOne(Category);
/**
 * Get all categories.
 * @function getAllCategories
 */
exports.getAllCategories = handleFactory.getAll(Category);
/**
 * Search for a category.
 * @function searchCategory
 */
exports.searchCategory = handleFactory.SearchData(Category);

/**
 * Create a new category.
 * @async
 * @function createCategory
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>}
 */
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

/**
 * Update an existing category.
 * @async
 * @function updateCategory
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>}
 */
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

/**
 * Delete a category.
 * @function deleteCategory
 */
exports.deleteCategory = handleFactory.deleteOne(Category);

// Dashboard
/**
 * Get top selling products.
 * @async
 * @function getProductTopSales
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>}
 */
exports.getProductTopSales = catchAsync(async (req, res, next) => {
  const salesProductTotals = await getProductSalesTotals();

  res.status(200).json({
    status: 'success',
    salesProductTotals,
  });
});

/**
 * Get top selling courses.
 * @async
 * @function getCourseTopSales
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>}
 */
exports.getCourseTopSales = catchAsync(async (req, res, next) => {
  const salesCourseTotals = await getCourseTopSales();

  return res.status(200).json({
    status: 'success',
    salesCourseTotals,
  });
});

/**
 * Get sales overview data.
 * @async
 * @function getSalesOverview
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>}
 */
exports.getSalesOverview = catchAsync(async (req, res, next) => {
  const salesData = await getSalesOverview();
  return res.status(200).json({
    status: 'success',
    salesData,
  });
});

/**
 * Verify an instructor.
 * @async
 * @function verifyInstructor
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>}
 */
exports.verifyInstructor = catchAsync(async (req, res, next) => {
  const instructor = await Instructor.update(req.body, {
    where: {
      instructorId: req.params.id,
    },
  });

  if (!instructor) {
    return next(new AppError('Instructor not found'));
  }

  if ('isApproved' in req.body) {
    res.status(200).json({
      status: 'success',
      message: 'Your account has been approved',
    });
  } else {
    res.status(200).json({
      status: 'fail',
      message: 'Your account has been rejected',
    });
  }
});
