const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PurchasedDetail = sequelize.define('purchased_detail', {
  purchasedDetailId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  purchasedId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'purchased',
      key: 'purchasedId',
    },
  },
  productId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'product',
      key: 'productId',
    },
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL,
    allowNull: false,
  },
  total: {
    type: DataTypes.DECIMAL,
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

module.exports = PurchasedDetail;
