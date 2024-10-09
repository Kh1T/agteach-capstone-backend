const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Enroll = sequelize.define('enroll', {
  enrollId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  courseId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'course', // Name of the referenced table
      key: 'course_id',
    },
  },
  customerId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'customer',
      key: 'customer_id',
    },
  },
  progress: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
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

module.exports = Enroll;
