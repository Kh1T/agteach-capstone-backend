const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Product = sequelize.define('Product', {
  product_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  instructor_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'instructors', // Name of the referenced table
      key: 'instructor_id',
    },
  },
  category_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'product_categories', // Name of the referenced table
      key: 'category_id',
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
  image_url: {
    type: DataTypes.TEXT,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = Product;
