const Product = require('../models/productModel');
const Course = require('../models/courseModel');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

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
