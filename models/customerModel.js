const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const UserAccount = require('./userModel');

const Customer = sequelize.define('customer', {
    customerId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING,
      // allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      // allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      // allowNull: false,
    },
    dateOfBirth: {
      type: DataTypes.DATE,
      // allowNull: false,i
    },
    email: {
      type: DataTypes.STRING,
      // allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING,
      // allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    userUid: {
      type: DataTypes.UUID,
      references: {
        model: 'user_account', // Name of the referenced model
        key: 'user_uid', // Key in the referenced model
      },
    },
  });
 
// Customer.belongsTo(UserAccount, { foreignKey: 'userUid' });
  
  module.exports = Customer;