const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SectionLecture = sequelize.define('section_lecture', {
  section_lecture_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  lecture_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'lectures', // name of the target table
      key: 'lecture_id',
    },
  },
  course_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'courses', // name of the target table
      key: 'course_id',
    },
  },
  instructor_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'instructors', // name of the target table
      key: 'instructor_id',
    },
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

module.exports = SectionLecture;
