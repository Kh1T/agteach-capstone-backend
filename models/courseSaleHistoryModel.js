const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CourseSaleHistory = sequelize.define('course_sale_history', {
  courseSaleHistoryId: {
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
  instructorId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'instructor', // Name of the referenced table
      key: 'instructor_id',
    },
  },
  customerId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'customer',
      key: 'customer_id',
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

module.exports = CourseSaleHistory;
