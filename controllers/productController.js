const Product = require('../models/productModel');
const ProductImage = require('../models/productImageModel');
const Location = require('../models/locationModel');
const Instructor = require('../models/instructorModel');
const catchAsync = require('../utils/catchAsync');
const handleFactory = require('./handlerFactory');
const AppError = require('../utils/appError');

const {
  uploadCoverImage,
  uploadAdditionalImages,
} = require('../utils/s3ImageUpload');
const {
  validateImages,
  removeProductImages,
  handleAddUpdateCoverImage,
} = require('../utils/imagesOperator');

exports.getAll = handleFactory.getAll(Product);
exports.deleteOne = handleFactory.deleteOne(Product);
exports.sortData = handleFactory.sortData(Product);
exports.searchData = handleFactory.SearchData(Product);

exports.recommendProduct = handleFactory.recommendItems(
  Product,
  'productId',
  'categoryId',
  ['instructorId', 'productId', 'name', 'price', 'imageUrl'],
);

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

exports.createProduct = catchAsync(async (req, res, next) => {
  // Validate cover and additional images

  validateImages(req.files.productCover, 'Product cover image', next);
  validateImages(req.files.productImages, 'Product images', next);

  // Create the product without the image URL initially
  const newProduct = await Product.create({
    ...req.body,
    instructorId: req.instructorId,
    imageUrl: '', // Placeholder for the cover image URL
  });

  // Upload product cover image
  await handleAddUpdateCoverImage(newProduct, req.files.productCover);

  // Upload additional images and save to the database
  const additionalImagesUrls = await uploadAdditionalImages(
    newProduct.productId,
    req.files.productImages,
  );

  await Promise.all(
    additionalImagesUrls.map((imageUrl) =>
      ProductImage.create({
        productId: newProduct.productId,
        imageUrl,
        isPrimary: false,
      }),
    ),
  );

  res.status(201).json({
    status: 'success',
    data: {
      product: newProduct,
      images: additionalImagesUrls,
    },
  });
});

exports.getProductImages = catchAsync(async (req, res, next) => {
  if (req.params.id === 'creating') {
    res.status(201).json({
      status: 'creating',
      images: [],
    });
  }
  const images = await ProductImage.findAll({
    where: { productId: req.params.id },
  });
  res.status(200).json({
    status: 'success',
    images,
  });
});

exports.updateProduct = catchAsync(async (req, res, next) => {
  const { id: productId } = req.params;
  const { categoryId, name, description, quantity, price, removedImages } =
    req.body;
  const product = await Product.findByPk(productId);
  if (!product) return next(new AppError('No product found with that ID', 404));
  // Update product properties
  Object.assign(product, { categoryId, name, description, quantity, price });

  // Remove specified images
  await removeProductImages(product.productId, removedImages);

  // Upload new cover image if provided
  if (req.files.productCover) {
    await handleAddUpdateCoverImage(product, req.files.productCover);
  }

  // Handle additional images
  const existingImages = await ProductImage.findAll({
    where: { productId },
    attributes: ['imageUrl'],
  });
  const existingImageUrls = new Set(
    existingImages.map(({ imageUrl }) => imageUrl),
  );
  if (req.files?.productImages) {
    const additionalImagesUrls = await uploadAdditionalImages(
      product.productId,
      req.files.productImages,
      existingImages,
    );
    const uniqueAdditionalImages = additionalImagesUrls.filter(
      (url) => !existingImageUrls.has(url),
    );
    // Save unique new images to the database
    await Product.saveAdditionalImages(
      product.productId,
      uniqueAdditionalImages,
    );
  }
  await product.save();
  // Fetch all images for the product to send in the response
  const allProductImages = await ProductImage.findAll({
    where: { productId: product.productId },
  });
  const uniqueImages = [
    ...new Set(allProductImages.map((img) => img.imageUrl)),
  ];
  res.status(200).json({
    status: 'success',
    data: {
      product,
      images: uniqueImages,
    },
  });
});

exports.getInstructorProduct = handleFactory.getUserItems(Product, Instructor);
