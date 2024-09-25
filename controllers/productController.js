const productModel = require('../models/productModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

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