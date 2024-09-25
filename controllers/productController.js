const Product = require('../models/productModel');
const handleFactory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');

exports.getAll = handleFactory.getAll(Product);
exports.deleteOne = handleFactory.deleteOne(Product);
exports.searchData = handleFactory.SearchData(Product);

exports.getProducts = catchAsync(async (req, res, next) => {
    const products = await productModel.findAll();
    res.status(200).json({
        status: 'success',
        results: products.length,
        data: {
            products,
        },
    });
})

exports.createProduct = factory.createOne(productModel)