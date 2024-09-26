const Product = require('../models/productModel');
const Course = require('../models/courseModel');
const handleFactory = require('./handlerFactory');

exports.getAll = handleFactory.getAll(Product);
exports.getOne = handleFactory.getOne(Product);
exports.deleteOne = handleFactory.deleteOne(Product);

exports.searchData = handleFactory.SearchData(Product);
