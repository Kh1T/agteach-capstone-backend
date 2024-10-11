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

const handleAdditionalImages = async (
  productId,
  productImages,
  existingImages,
) => {
  if (productImages) {
    const existingImageUrls = new Set(
      existingImages.map(({ imageUrl }) => imageUrl),
    );
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
};

const uploadAndSaveAdditionalImages = async (productId, productImages) => {
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
  return additionalImagesUrls;
};

module.exports = {
  validateImages,
  removeProductImages,
  handleAddUpdateCoverImage,

  handleAdditionalImages,
  uploadAndSaveAdditionalImages,
};
