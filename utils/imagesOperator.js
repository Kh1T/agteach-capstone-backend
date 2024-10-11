const { uploadCoverImage, uploadAdditionalImages } = require('./s3ImageUpload');
const AppError = require('./appError');

const Product = require('../models/productModel');
const ProductImage = require('../models/productImageModel');

const validateImages = (files, name, next) => {
  if (!files || files.length === 0) {
    return next(new AppError(`${name} is required`, 400));
  }
};
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

const handleAddUpdateCoverImage = async (product, productCover) => {
  const productCoverBuffer = productCover[0].buffer;
  const productCoverUrl = await uploadCoverImage(
    product.productId,
    productCoverBuffer,
  );
  product.imageUrl = productCoverUrl;
  await product.save();
};

const fetchProductImages = async (productId) => {
  const allProductImages = await ProductImage.findAll({
    where: { productId },
  });
  return new Set(allProductImages.map((img) => img.imageUrl));
};
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
