const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SectionLecture = sequelize.define('section_lecture', {
  sectionLectureId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  lectureId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'lectures', // name of the target table
      key: 'lectureId',
    },
  },
  courseId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'course', // name of the target table
      key: 'courseId',
    },
  },
  instructorId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'instructor', // name of the target table
      key: 'instructorId',
    },
  },
  sectionId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'section',
      key: 'sectionId',
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

module.exports = SectionLecture;

SectionLecture.afterBulkCreate(async (sectionLecture, options) => {
  console.log(sectionLecture);
  // await uploadCourseVideosFile(sectionLecture, options);
});
