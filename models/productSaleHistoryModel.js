const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProductSaleHistory = sequelize.define('product_sale_history', {
  productSaleHistoryId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  productId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'product',
      key: 'productId',
    },
  },
  customerId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'customer',
      key: 'customerId',
    },
  },
  purchasedDetailId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'purchasedDetail',
      key: 'purchasedDetailId',
    },
  },
  instructorId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'instructor',
      key: 'instructorId',
    },
  },
  isDelivered: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    default: false,
  },
  purchasedId:{
    type: DataTypes.INTEGER,
    references: {
      model: 'purchased',
      key: 'purchasedId',
    },
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

module.exports = ProductSaleHistory;
