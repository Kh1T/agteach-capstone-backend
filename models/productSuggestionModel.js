const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProductSuggestion = sequelize.define('product_suggestion', {
  productSuggestionId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  courseId: {
    type: DataTypes.INTEGER,
  },
  productId: {
    type: DataTypes.INTEGER,
  },
  instructorId: {
    type: DataTypes.INTEGER,
  },
});

module.exports = ProductSuggestion;
