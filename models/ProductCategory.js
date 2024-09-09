const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ProductCategory = sequelize.define(
  "product_category",
  {
    category_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
  },
  {
    tableName: "product_category", // Explicitly set the table name
    timestamps: false, // Disable automatic timestamps if not needed
  },
);

module.exports = ProductCategory;
