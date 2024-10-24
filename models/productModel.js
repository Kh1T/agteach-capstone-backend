const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProductImage = require('./productImageModel');
const { deleteFolderS3 } = require('../utils/uploadMiddleware');

const Product = sequelize.define('product', {
  productId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  instructorId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'instructor', // Name of the referenced table
      key: 'instructorId',
    },
  },
  categoryId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'product_category', // Name of the referenced table
      key: 'categoryId',
    },
  },
  name: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  imageUrl: {
    type: DataTypes.TEXT,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

// Method to save additional images to the database
Product.saveAdditionalImages = async function (
  productId,
  additionalImagesUrls,
) {
  await Promise.all(
    additionalImagesUrls.map((imageUrl) =>
      ProductImage.create({ productId, imageUrl, isPrimary: false }),
    ),
  );
};

// Delete Product after destroy
Product.afterDestroy(async (product) => {
  console.log(await deleteFolderS3(product.productId, 'products'));
});

module.exports = Product;
