const Product = require('../models/productModel');
const handleFactory = require('./handlerFactory');

exports.getAll = handleFactory.getAll(Product);
exports.deleteOne = handleFactory.deleteOne(Product);
exports.searchData = handleFactory.SearchData(Product);
