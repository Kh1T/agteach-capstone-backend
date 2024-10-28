const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Section = sequelize.define('section', {
  sectionId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  instructorId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'instructors', // name of the referenced table
      key: 'instructorId',
    },
  },
  courseId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'course', // name of the referenced table
      key: 'courseId',
    },
  },
  name: {
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

module.exports = Section;
