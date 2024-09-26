const Product = require('../models/productModel');
const Course = require('../models/courseModel');
const handleFactory = require('./handlerFactory');

exports.getAll = handleFactory.getAll(Product);
exports.getOne = handleFactory.getOne(Product);
exports.deleteOne = handleFactory.deleteOne(Product);

exports.searchData = handleFactory.SearchData(Product);

exports.sortData = async (req, res, next) => {
  const sortOrder = req.query.order || 'ASC';

  const data = await Product.findAll({
    order: [['createdAt', sortOrder]],
  });

  res.status(200).json({
    status: 'success',
    results: data.length,
    data,
  });
};
