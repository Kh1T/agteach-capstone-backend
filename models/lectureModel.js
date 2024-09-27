const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

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


// Lecture.afterCreate(async (user, option) => {
//   // uploadCourseVideosFile.single('video');
//   console.log(user);
//   user.videoUrl = '';
//   // console.log(user);
// });