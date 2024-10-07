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
  const { userUid } = req.user.dataValues;
  // Validate cover and additional images
  const validateImages = (files, name) => {
    if (!files || files.length === 0) {
      return res.status(400).json({ error: `${name} is required` });
    }
  };
  validateImages(req.files.productCover, 'Product cover image');
  validateImages(req.files.productImages, 'Product images');

  const instructor = await Instructor.findOne({ where: { userUid } });

  // Create the product without the image URL initially
  const newProduct = await Product.create({
    ...req.body,
    instructorId: instructor.instructorId,
    imageUrl: '', // Placeholder for the cover image URL
  });

  // Upload product cover image and update product record
  const productCoverBuffer = req.files.productCover[0].buffer;
  newProduct.imageUrl = await uploadCoverImage(
    newProduct.productId,
    productCoverBuffer,
  );
  await newProduct.save();

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
  if (!product) return res.status(404).json({ error: 'Product not found' });
  // Update product properties
  Object.assign(product, { categoryId, name, description, quantity, price });
  // Remove specified images
  if (removedImages) {
    await ProductImage.destroy({
      where: {
        productId: product.productId,
        imageUrl: JSON.parse(removedImages),
      },
    });
  }
  // Upload new cover image if provided
  if (req.files?.productCover) {
    const productCoverUrl = await uploadCoverImage(
      product.productId,
      req.files.productCover[0].buffer,
    );
    product.imageUrl = productCoverUrl;
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
    await Promise.all(
      uniqueAdditionalImages.map((imageUrl) =>
        ProductImage.create({
          productId: product.productId,
          imageUrl,
          isPrimary: false,
        }),
      ),
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
