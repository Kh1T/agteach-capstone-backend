const Course = require('../models/courseModel');
const catchAsync = require('../utils/catchAsync');
const handleFactory = require('./handlerFactory');

exports.searchData = handleFactory.SearchData(Course);

exports.getAll = handleFactory.getAll(Course);
exports.getOne = handleFactory.getOne(Course);
exports.deleteOne = handleFactory.deleteOne(Course);

exports.createCourse = catchAsync(async (req, res, next) => {});
