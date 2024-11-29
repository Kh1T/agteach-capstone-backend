const Product = require('../models/productModel');
const Course = require('../models/courseModel');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * @description Retrieves an overview of all products and courses.
 * @async
 * @function getOverview
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Promise<void>}
 */
exports.getOverview = catchAsync(async (req, res, next) => {
  const products = await Product.findAll();
  const courses = await Course.findAll();

  res.status(200).json({
    status: 'Succes get All Courses and Products',
    data: {
      products,
      courses,
    },
  });
});
