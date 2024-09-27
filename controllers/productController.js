const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3Connection');

const Product = require('../models/productModel');
const ProductImage = require('../models/productImageModel');
const Instructor = require('../models/instructorModel');
const catchAsync = require('../utils/catchAsync');
const handleFactory = require('./handlerFactory');
const {
  uploadCoverImage,
  uploadAdditionalImages,
} = require('../utils/s3ImageUpload');

exports.getAll = handleFactory.getAll(Product);
exports.getOne = handleFactory.getOne(Product);
exports.deleteOne = handleFactory.deleteOne(Product);
exports.sortData = handleFactory.sortData(Product);
exports.searchData = handleFactory.SearchData(Product);

exports.createProduct = catchAsync(async (req, res, next) => {
  const instructor = await Instructor.findOne({
    where: { userUid: req.user.dataValues.userUid },
  });

  if (!req.files.productCover || req.files.productCover.length === 0) {
    return res.status(400).json({ error: 'Product cover image is required' });
  }

  if (!req.files.productImages || req.files.productImages.length === 0) {
    return res.status(400).json({ error: 'Product images are required' });
  }

  // Step 2: Create the product without the image URL first
  const newProduct = await Product.create({
    ...req.body,
    instructorId: instructor.instructorId,
    imageUrl: '', // Will be updated after image upload
  });

  // Upload product cover image
  const productCoverBuffer = req.files.productCover[0].buffer;
  const productCoverUrl = await uploadCoverImage(
    newProduct.productId,
    productCoverBuffer,
  );
  newProduct.imageUrl = productCoverUrl;
  await newProduct.save();

  // Upload additional product images
  const additionalImagesUrls = await uploadAdditionalImages(
    newProduct.productId,
    req.files.productImages,
  );

  // Save additional images to the database
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
  const images = await ProductImage.findAll({
    where: { productId: req.params.id },
  });
  res.status(200).json({
    status: 'success',
    images,
  });
});

exports.updateProduct = catchAsync(async (req, res, next) => {
  const productId = req.params.id; // Product ID from the URL parameters
  const { categoryId, name, description, quantity, price } = req.body;

  const product = await Product.findByPk(productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  if (categoryId) product.categoryId = categoryId;
  if (name) product.name = name;
  if (description) product.description = description;
  if (quantity) product.quantity = quantity;
  if (price) product.price = price;

  // Step 3: Check if a new product cover image is uploaded
  if (req.files && req.files.productCover) {
    // Upload the new product cover image and update the product's imageUrl
    const productCoverBuffer = req.files.productCover[0].buffer;
    const productCoverUrl = await uploadCoverImage(
      product.productId,
      productCoverBuffer,
    );
    product.imageUrl = productCoverUrl; // Update with new cover URL
  }

  // Step 4: Handle additional images if provided
  let additionalImagesUrls = [];
  if (req.files && req.files.productImages) {
    // Upload new additional images
    additionalImagesUrls = await uploadAdditionalImages(
      product.productId,
      req.files.productImages,
    );

    // Replace the old images in the database
    await ProductImage.destroy({ where: { productId: product.productId } }); 
    // Save new images to the database
    await Promise.all(
      additionalImagesUrls.map((imageUrl) =>
        ProductImage.create({
          productId: product.productId,
          imageUrl,
          isPrimary: false,
        }),
      ),
    );
  }
  await product.save();
  res.status(200).json({
    status: 'success',
    data: {
      product,
      images: additionalImagesUrls.length
        ? additionalImagesUrls
        : 'No new images uploaded',
    },
  });
});
