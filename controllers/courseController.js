const Course = require('../models/courseModel');
const handleFactory = require('./handlerFactory');

exports.getAll = handleFactory.getAll(Course);
exports.getOne = handleFactory.getOne(Course);
exports.deleteOne = handleFactory.deleteOne(Course);
exports.searchData = handleFactory.SearchData(Course);