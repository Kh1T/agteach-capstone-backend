const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Lecture = sequelize.define('lecture', {
  lecture_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  instructor_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'instructors', // name of the referenced table
      key: 'instructor_id',
    },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  video_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  duration: {
    type: DataTypes.STRING,
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

module.exports = Lecture;
