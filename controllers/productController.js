const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3Connection');

const Product = require('../models/productModel');
const ProductImage = require('../models/productImageModel');
const catchAsync = require('../utils/catchAsync');
const handleFactory = require('./handlerFactory');

exports.getAll = handleFactory.getAll(Product);
exports.getOne = handleFactory.getOne(Product);
exports.deleteOne = handleFactory.deleteOne(Product);
exports.sortData = handleFactory.sortData(Product);
exports.searchData = handleFactory.SearchData(Product);
exports.createProduct = catchAsync(async (req, res, next) => {
  const {
    name,
    price,
    description,
    quantity,
    instructorId,
    categoryId,
    productId,
  } = req.body;

  // Step 1: Create the product without the image URL first
  const newProduct = await Product.create({
    name,
    price,
    description,
    quantity,
    instructorId,
    categoryId,
    productId,
    imageUrl: '', // Will be updated after image upload
  });

  // Step 2: Store the productId for image uploads
  req.body.productId = newProduct.productId;

  // Step 3: Define the product cover name (S3 Key) without CloudFront URL
  const productCoverName = `products/${req.body.productId}/product-cover-image.jpeg`;

  // Step 4: Upload the Product Cover Image to S3
  const input = {
    Bucket: process.env.AWS_S3_PRODUCT_ASSET_BUCKET,
    Key: productCoverName,
    Body: req.files.productCover[0].buffer,
    ContentType: 'image/jpeg',
  };

  await s3Client.send(new PutObjectCommand(input));

  req.body.imageUrl = `${process.env.CLOUDFRONT_URL}/${productCoverName}`;

  newProduct.imageUrl = req.body.imageUrl;
  await newProduct.save();

  req.body.images = [];

  await Promise.all(
    req.files.productImages.map(async (file, id) => {
      const filename = `products/${req.body.productId}/product-images-${id + 1}.jpeg`;

      const inputProducts = {
        Bucket: process.env.AWS_S3_PRODUCT_ASSET_BUCKET,
        Key: filename,
        Body: file.buffer,
        ContentType: 'image/jpeg',
      };
      console.log(inputProducts);
      await s3Client.send(new PutObjectCommand(inputProducts));

      const imageUrl = `${process.env.CLOUDFRONT_URL}/${filename}`;
      req.body.images.push(imageUrl);

      console.log(req.body.productId);

      await ProductImage.create({
        productId: req.body.productId, // Match your schema's field name
        imageUrl: imageUrl, // The URL of the uploaded image
        isPrimary: false, // You can set this based on your logic, e.g., false for additional images
      });
    }),
  );

  // Step 8: Respond with the newly created product including the image URL and uploaded images
  res.status(201).json({
    status: 'success',
    data: {
      product: newProduct,
      images: req.body.images, // Include the additional images
    },
  });
});
