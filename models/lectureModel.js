const { DataTypes } = require('sequelize');
const fs = require('fs');
const path = require('path');
// const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getVideoDurationInSeconds } = require('get-video-duration');
const sequelize = require('../config/db');
const AppError = require('../utils/appError');
const { uploadCourseVideosFile } = require('../utils/uploadMiddleware');

const Lecture = sequelize.define('lecture', {
  lectureId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  instructorId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'instructor', // name of the referenced table
      key: 'instructorId',
    },
  },
  sectionId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'section', // name of the referenced table
      key: 'sectionId',
    },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  videoUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue:
      'https://northatlanticaviationmuseum.com/wp-content/uploads/2020/10/Lorem-ipsum-video-Dummy-video-for-your-website.mp4?_=2',
  },
  duration: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '00:00:00',
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

module.exports = Lecture;

// Lecture.afterBulkCreate(async (lectures, options) => {
//   await uploadCourseVideosFile(lectures, options);
// });

Lecture.afterBulkCreate(async (sectionLecture, options) => {

  // console.log(sectionLecture);
  // console.log('options', options)
  // await uploadCourseVideosFile(sectionLecture, options);
 
});
