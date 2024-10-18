const sharp = require('sharp');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3Connection');

// Upload cover image and return the image URL
const uploadCoverImage = async (productId, productCoverBuffer) => {
  // Resize the image to 580x550 pixels
  const resizedImageBuffer = await sharp(productCoverBuffer)
    .resize(580, 550)
    .jpeg({ quality: 80 }) // Optional: adjust quality
    .toBuffer();

  const productCoverName = `products/${productId}/product-cover-image.jpeg`;

  const input = {
    Bucket: process.env.AWS_S3_ASSET_BUCKET,
    Key: productCoverName,
    Body: resizedImageBuffer, // Use the resized image buffer
    ContentType: 'image/jpeg',
  };

  await s3Client.send(new PutObjectCommand(input));

  const imageUrl = process.env.AWS_S3_BUCKET_URL + productCoverName;

  return imageUrl;
};

// Upload additional images and return an array of image URLs
const uploadAdditionalImages = async (
  productId,
  productImages,
  existingImages = [],
) => {
  const imageUrls = [];

  // Step 1: Extract existing image numbers from URLs (e.g., 1, 2, 3 from product-images-1.jpeg)
  const existingImageNumbers = existingImages
    .map(({ imageUrl }) => {
      const match = imageUrl.match(/product-images-(\d+)\.jpeg$/); // Extract number from filename
      return match ? parseInt(match[1], 10) : null;
    })
    .filter((num) => num !== null); // Filter out null values

  // Step 2: Determine available numbers between 1 and 4
  const maxImageSlots = 4;
  const availableNumbers = [];
  for (let i = 1; i <= maxImageSlots; i += 1) {
    if (!existingImageNumbers.includes(i)) {
      availableNumbers.push(i); // Push available slots
    }
  }

  // Step 3: Upload each new image to the lowest available number
  await Promise.all(
    productImages.map(async (file, index) => {
      if (availableNumbers.length === 0) {
        throw new Error('No available image slots left (1-4)');
      }

      // Get the lowest available number
      const imageIndex = availableNumbers.shift(); // Assign the first available number
      const filename = `products/${productId}/product-images-${imageIndex}.jpeg`;

      const resizedImageBuffer = await sharp(file.buffer)
        .resize(580, 550)
        .jpeg({ quality: 80 }) // Optional: adjust quality
        .toBuffer();

      const input = {
        Bucket: process.env.AWS_S3_ASSET_BUCKET,
        Key: filename,
        Body: resizedImageBuffer,
        ContentType: 'image/jpeg',
      };

      // Upload the image to S3
      await s3Client.send(new PutObjectCommand(input));
      const imageUrl = process.env.AWS_S3_BUCKET_URL + filename;

      // Push the image URL to the array
      imageUrls.push(imageUrl);
    }),
  );

  return imageUrls;
};

module.exports = {
  uploadCoverImage,
  uploadAdditionalImages,
};
