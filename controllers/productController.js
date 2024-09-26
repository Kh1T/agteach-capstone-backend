const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3Connection');

const Product = require('../models/productModel');
const ProductImage = require('../models/productImageModel');
const catchAsync = require('../utils/catchAsync');
const handleFactory = require('./handlerFactory');

exports.getAll = handleFactory.getAll(Product);
exports.deleteOne = handleFactory.deleteOne(Product);
exports.searchData = handleFactory.SearchData(Product);
exports.createProduct = catchAsync(async (req, res, next) => {
  try {
    // Step 1: Validate required fields
    console.log(req.user);
    console.log(req.files)
    const { categoryId, name, description, quantity, price } = req.body;
    if (!req.files.productCover || req.files.productCover.length === 0) {
      return res.status(400).json({ error: 'Product cover image is required' });
    }

    // Step 2: Create the product without the image URL first
    const newProduct = await Product.create({
      categoryId, // Ensure these fields match your schema
      name,
      description,
      quantity,
      price,
      // instructorId: req.user.id,
      imageUrl: '', // Will be updated after image upload
    });

    // Step 3: Define the product cover name (S3 Key) without CloudFront URL
    const productCoverName = `products/${newProduct.productId}/product-cover-image.jpeg`;

    // Step 4: Upload the Product Cover Image to S3
    const productCoverBuffer = req.files.productCover[0].buffer; // Access buffer safely
    const input = {
      Bucket: process.env.AWS_S3_PRODUCT_ASSET_BUCKET,
      Key: productCoverName,
      Body: productCoverBuffer,
      ContentType: 'image/jpeg',
    };

    await s3Client.send(new PutObjectCommand(input));

    // Step 5: Update the product with image URL
    const imageUrl = `${process.env.CLOUDFRONT_URL}/${productCoverName}`;
    newProduct.imageUrl = imageUrl;
    await newProduct.save();

    // Step 6: Handle additional images
    req.body.images = []; // Initialize images array
    if (req.files.productImages) {
      await Promise.all(
        req.files.productImages.map(async (file, id) => {
          const filename = `products/${newProduct.productId}/product-images-${id + 1}.jpeg`;
          const inputProducts = {
            Bucket: process.env.AWS_S3_PRODUCT_ASSET_BUCKET,
            Key: filename,
            Body: file.buffer,
            ContentType: 'image/jpeg',
          };

          await s3Client.send(new PutObjectCommand(inputProducts));
          const additionalImageUrl = `${process.env.CLOUDFRONT_URL}/${filename}`;
          req.body.images.push(additionalImageUrl);

          // Save additional images to the database
          await ProductImage.create({
            productId: newProduct.productId,
            imageUrl: additionalImageUrl,
            isPrimary: false,
          });
        }),
      );
    }

    // Step 7: Respond with the newly created product including the image URL and uploaded images
    res.status(201).json({
      status: 'success',
      data: {
        product: newProduct,
        images: req.body.images, // Include the additional images
      },
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
