const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

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
  address: {
    type: DataTypes.STRING,
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
      key: 'userUid', // Key in the referenced model
    },
  },
  locationId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'location', // Name of the referenced model
      key: 'locationId', // Key in the referenced model
    },
  },
});

module.exports = Customer;
