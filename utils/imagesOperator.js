const { uploadCoverImage, uploadAdditionalImages } = require('./s3ImageUpload');
const AppError = require('./appError');

const Product = require('../models/productModel');
const ProductImage = require('../models/productImageModel');


/**
 * Validate if the provided images are not empty.
 *
 * @param {Array<Express.Multer.File>} files - The images uploaded by the user
 * @param {string} name - The name of the image field (e.g., "productCover" or "productImages")
 * @param {NextFunction} next - The express next function to call if the images are invalid
 */
const validateImages = (files, name, next) => {
  if (!files || files.length === 0) {
    return next(new AppError(`${name} is required`, 400));
  }
};

/**
 * Deletes images from the database based on the provided image URLs.
 *
 * @param {number} productId - The ID of the product
 * @param {string} removedImages - A JSON string of image URLs to remove
 * @returns {Promise<void>} A promise that resolves when the images are removed
 */
const removeProductImages = async (productId, removedImages) => {
  if (removedImages) {
    await ProductImage.destroy({
      where: {
        productId,
        imageUrl: JSON.parse(removedImages),
      },
    });
  }
};

/**
 * Handles adding or updating a product cover image.
 *
 * @param {Object} product - The product document to update
 * @param {Array} productCover - An array of multer file objects
 * @return {Promise<void>}
 */
const handleAddUpdateCoverImage = async (product, productCover) => {
  const productCoverBuffer = productCover[0].buffer;
  const productCoverUrl = await uploadCoverImage(
    product.productId,
    productCoverBuffer,
  );
  product.imageUrl = productCoverUrl;
  await product.save();
};

/**
 * Fetches all image URLs for a given product ID.
 *
 * @param {number} productId - The ID of the product
 * @returns {Promise<Set<string>>} A promise that resolves with a Set of image URLs
 */
const fetchProductImages = async (productId) => {
  const allProductImages = await ProductImage.findAll({
    where: { productId },
  });
  return new Set(allProductImages.map((img) => img.imageUrl));
};
/**
 * Handles adding or updating additional images for a product.
 *
 * @param {string} mode - One of 'add' or 'edit' to indicate whether this is a
 *   new product or an existing product being edited
 * @param {number} productId - The ID of the product
 * @param {Array} productImages - An array of multer file objects
 * @return {Promise<void>}
 */
const handleAddUpdateAdditionalImages = async (
  mode,
  productId,
  productImages,
) => {
  // When User First Create Product and upload additional images (done)
  if (mode === 'add') {
    const additionalImagesUrls = await uploadAdditionalImages(
      productId,
      productImages,
    );

    await Promise.all(
      additionalImagesUrls.map((imageUrl) =>
        ProductImage.create({
          productId,
          imageUrl,
          isPrimary: false,
        }),
      ),
    );
  }
  // When User Start Editing Product and upload additional images
  if (mode === 'edit') {
    const existingImages = await ProductImage.findAll({
      where: { productId },
      attributes: ['imageUrl'],
    });
    const existingImageUrls = new Set(
      existingImages.map(({ imageUrl }) => imageUrl),
    );

    if (productImages) {
      const additionalImagesUrls = await uploadAdditionalImages(
        productId,
        productImages,
        existingImages,
      );
      const uniqueAdditionalImages = additionalImagesUrls.filter(
        (url) => !existingImageUrls.has(url),
      );
      await Product.saveAdditionalImages(productId, uniqueAdditionalImages);
    }
  }
};

module.exports = {
  validateImages,
  removeProductImages,
  fetchProductImages,
  handleAddUpdateCoverImage,
  handleAddUpdateAdditionalImages,
};
