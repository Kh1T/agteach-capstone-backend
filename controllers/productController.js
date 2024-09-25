const Product = require('../models/productModel');
const Course = require('../models/courseModel');
const handleFactory = require('./handlerFactory');
const catchAsync = require('./../utils/catchAsync');
const { Op } = require('sequelize');

exports.getAll = handleFactory.getAll(Product);
exports.deleteOne = handleFactory.deleteOne(Product);
exports.searchData = handleFactory.SearchData(Product, 'name');
