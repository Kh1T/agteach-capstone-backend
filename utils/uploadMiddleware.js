const sharp = require('sharp');
const { PutObjectCommand } = require('@aws-sdk/client-s3');

const Product = require('../models/productModel');

const catchAsync = require('./catchAsync');
const s3Client = require('../config/s3Connection');


// Upload Profile Image
// Need User role from protected route
const resizeUploadProfileImage = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next();
  }
  req.file.filename = `${req.user.role}s/${req.user.userUid}/profile-image.jpeg`;

  const buffer = await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toBuffer();

  const input = {
    Bucket: process.env.AWS_S3_ASSET_BUCKET,
    Key: req.file.filename,
    Body: buffer,
    ContentType: 'image/jpeg',
  };
  await s3Client.send(new PutObjectCommand(input));
  req.file.filename = process.env.AWS_S3_BUCKET_URL + req.file.filename;
  next();
});


// Upload Product Image
// If there is no file uploaded, It will go to next middleware
const resizeUploadProductImages = catchAsync(async (req, res, next) => {
  if (!req.files) return next();

  const productCoverName = `${process.env.CLOUDFRONT_URL}/products/${req.body.productId}/product-cover-image.jpeg`;
  // Upload Product Cover Image
  const input = {
    Bucket: process.env.AWS_S3_PRODUCT_ASSET_BUCKET,
    Key: productCoverName,
    Body: req.files.productCover[0].buffer,
    ContentType: 'image/jpeg',
  };

  await s3Client.send(new PutObjectCommand(input));
  req.body.imageUrl = productCoverName;
  const product = await Product.findByPk(req.body.productId);
  product.imageUrl = req.body.imageUrl;
  await product.save();
  console.log(product.imageUrl);
  next();
  req.body.images = [];

  // await Promise.all(req.files.productImages.map(async (file, id) => {
  //   const filename = `products/${req.body.productUid}/product-images-${id + 1}.jpeg`;

  //   const inputProducts = {
  //     Bucket: process.env.AWS_S3_PRODUCT_ASSET_BUCKET,
  //     Key: filename,
  //     Body: file.buffer,
  //     ContentType: 'image/jpeg',
  //   };
  //   console.log(inputProducts);
  //   await s3Client.send(new PutObjectCommand(inputProducts));
  //   // When get image back from s3, it will need BUCKET_URL or CloudFront URL
  //   // For monitor image in CloudFront and cache for easy access
  //   // filename: products/p001/product-images-1.jpeg
  //   req.body.images.push(filename);
  //   console.log(req.body.images);
  // }));

  next();
});
const uploadCourseVideosFile = catchAsync(async (req, res, next) => {
  if (!req.file) next();
  
  req.file.filename = `courses/${req.body.courseId}/section_${req.body.sectionId}/lecture-${req.body.orderId}`;

  const input = {
    Bucket: process.env.AWS_S3_COURSE_ASSET_BUCKET,
    Key: req.file.filename,
    Body: req.file.buffer,
    ContentType: 'video/mp4',
  }

  await s3Client.send(new PutObjectCommand(input));

  next();

});
module.exports = { resizeUploadProfileImage, resizeUploadProductImages,uploadCourseVideosFile };
