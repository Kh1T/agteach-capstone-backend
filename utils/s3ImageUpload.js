const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3Connection');

// Upload cover image and return the image URL
const uploadCoverImage = async (productId, productCoverBuffer) => {
  const productCoverName = `products/${productId}/product-cover-image.jpeg`;

  const input = {
    Bucket: process.env.AWS_S3_PRODUCT_ASSET_BUCKET,
    Key: productCoverName,
    Body: productCoverBuffer,
    ContentType: 'image/jpeg',
  };

  await s3Client.send(new PutObjectCommand(input));

  const imageUrl = `http://${process.env.CLOUDFRONT_URL}/${productCoverName}`;
  return imageUrl;
};

// Upload additional images and return an array of image URLs
const uploadAdditionalImages = async (productId, productImages) => {
  const imageUrls = [];

  await Promise.all(
    productImages.map(async (file, index) => {
      const filename = `products/${productId}/product-images-${index + 1}.jpeg`;

      const input = {
        Bucket: process.env.AWS_S3_PRODUCT_ASSET_BUCKET,
        Key: filename,
        Body: file.buffer,
        ContentType: 'image/jpeg',
      };

      await s3Client.send(new PutObjectCommand(input));
      const imageUrl = `http://${process.env.CLOUDFRONT_URL}/${filename}`;
      imageUrls.push(imageUrl);
    }),
  );

  return imageUrls;
};

module.exports = {
  uploadCoverImage,
  uploadAdditionalImages,
};
