const { Op } = require('sequelize');
const Product = require('../models/productModel');
const ProductImage = require('../models/productImageModel');
const Location = require('../models/locationModel');
const Instructor = require('../models/instructorModel');
const catchAsync = require('../utils/catchAsync');
const handleFactory = require('./handlerFactory');
const AppError = require('../utils/appError');
const ProductCategory = require('../models/productCategoryModel');
const APIFeatures = require('../utils/apiFeatures');
const {
  validateImages,
  removeProductImages,
  handleAddUpdateCoverImage,
  handleAddUpdateAdditionalImages,
  fetchProductImages,
} = require('../utils/imagesOperator');

exports.getAll = handleFactory.getAll(Product);
exports.deleteOne = handleFactory.deleteOne(Product);
exports.searchData = handleFactory.SearchData(Product);

exports.recommendProduct = handleFactory.recommendItems(
  Product,
  'productId',
  'categoryId',
  ['instructorId', 'productId', 'name', 'price', 'imageUrl'],
);

/**
 * @description Get product detail by product ID.
 * @async
 * @function getProductDetail
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Promise<void>}
 */
exports.getProductDetail = catchAsync(async (req, res, next) => {
  const product = await Product.findOne({
    where: { productId: req.params.id },
    include: [
      { model: ProductImage },
      { model: Instructor, include: { model: Location, attributes: ['name'] } },
    ],
  });

  if (!product) {
    return next(new AppError('No product found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: product,
  });
});

/**
 * @description Creates a new product with cover and additional images.
 * @async
 * @function createProduct
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Promise<void>}
 */
exports.createProduct = catchAsync(async (req, res, next) => {
  // Validate cover and additional images
  validateImages(req.files.productCover, 'Product cover image', next);
  validateImages(req.files.productImages, 'Product images', next);

  // Create the product without the image URL initially
  const { instructorId } = req.memberData;
  const newProduct = await Product.create({
    ...req.body,
    instructorId,
    imageUrl: '',
  });

  // Upload product cover image
  await handleAddUpdateCoverImage(newProduct, req.files.productCover);

  // Upload additional images and save to the database
  await handleAddUpdateAdditionalImages(
    'add',
    newProduct.productId,
    req.files.productImages,
  );

  res.status(201).json({
    status: 'success',
    data: {
      product: newProduct,
      images: newProduct.images,
    },
  });
});

/**
 * @description Retrieves product images based on product ID.
 * @async
 * @function getProductImages
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Promise<void>}
 */
exports.getProductImages = catchAsync(async (req, res, next) => {
  if (req.params.id === 'creating') {
    res.status(201).json({
      status: 'creating',
      images: [],
    });
  } else {
    const images = await ProductImage.findAll({
      where: { productId: req.params.id },
    });
    res.status(200).json({
      status: 'success',
      images,
    });
  }
});

/**
 * Updates a product with the given data.
 * @function updateProduct
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Promise<void>}
 */
exports.updateProduct = catchAsync(async (req, res, next) => {
  const { id: productId } = req.params;
  const { categoryId, name, description, quantity, price, removedImages } =
    req.body;
  const product = await Product.findByPk(productId);

  if (!product) return next(new AppError('No product found with that ID', 404));

  Object.assign(product, { categoryId, name, description, quantity, price });

  await removeProductImages(product.productId, removedImages);

  if (req.files.productCover) {
    await handleAddUpdateCoverImage(product, req.files.productCover);
  }

  if (req.files?.productImages?.length > 0) {
    await handleAddUpdateAdditionalImages(
      'edit',
      product.productId,
      req.files.productImages,
    );
  }

  await product.save();

  const uniqueImages = await fetchProductImages(product.productId);

  res.status(200).json({
    status: 'success',
    data: {
      product,
      images: uniqueImages,
    },
  });
});

/**
 * @description Retrieves products associated with an instructor.
 * @async
 * @function getInstructorProduct
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Promise<void>}
 */
exports.getInstructorProduct = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Product, req.query, Instructor)
    .search()
    .sort()
    .userItems(req.user.userUid);

  const item = await features.execute();

  res.status(200).json({
    status: 'success',
    result: item.length,
    item,
  });
});
