const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Category = sequelize.define('product_category', {
    categoryId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
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

module.exports = Category