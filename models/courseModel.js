const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Course = sequelize.define('course', {
  courseId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  instructorId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'instructor', // Name of the referenced table
      key: 'instructor_id',
    },
  },
  name: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  previewVideoUrl: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  thumbnailUrl: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  duration: {
    type: DataTypes.STRING, // Sequelize doesn't support INTERVAL, use STRING or INTEGER
    allowNull: false,
  },
  numberOfVideo: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  courseObjective: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  price: {
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

module.exports = Course;
