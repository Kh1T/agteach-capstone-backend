const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { uploadCourseVideosFile } = require('../utils/uploadMiddleware');

const Lecture = require('./lectureModel');

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
      key: 'lecture_id',
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
// uploadProfileImage.single('photo');
SectionLecture.afterCreate(async (user, options) => {
  // uploadCourseVideosFile.single('video');

  // user.videoUrl = videoUrl;
  // Step 2: Find the related lecture using sectionLecture.lecture_id

  await uploadCourseVideosFile(user, options);

  // console.log(result, 'result');

  //   const lecture = await Lecture.findByPk(user.lectureId);
  // console.log(videoUrl, 'lecture')
  //   if (lecture && videoUrl) {
  //       // Step 3: Update the lecture with the video URL
  //       console.log(videoUrl, videoUrl);
  //       // lecture.videoUrl = videoUrl;
  //       await lecture.save(); // Save the updated lecture
  //   }
  // console.log(options, 'fileaaaa')
  // console.log(user);
});
