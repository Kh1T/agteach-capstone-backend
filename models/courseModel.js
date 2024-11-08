const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const {
  resizeUplaodCourseThumbail,
  deleteFolderS3,
} = require('../utils/uploadMiddleware');

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
      key: 'instructorId',
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
    defaultValue:
      'https://northatlanticaviationmuseum.com/wp-content/uploads/2020/10/Lorem-ipsum-video-Dummy-video-for-your-website.mp4?_=2',
  },
  thumbnailUrl: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: 'https://placehold.co/400',
  },
  courseUrl: {
    type: DataTypes.VIRTUAL,
    get() {
      return `https://alphabeez.anbschool.org/courses/${this.courseId}`;
    },
  },
  duration: {
    type: DataTypes.STRING, // Sequelize doesn't support INTERVAL, use STRING or INTEGER
    allowNull: false,
    defaultValue: '00:00:00',
  },
  numberOfVideo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 12,
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

Course.afterCreate(async (course, options) => {
  if (!options.files) return;
  resizeUplaodCourseThumbail(course, options);
});

Course.afterUpdate(async (course, options) => {
  if (!options.files) return;
  resizeUplaodCourseThumbail(course, options);
});

Course.afterDestroy(async (course) => {
  console.log(await deleteFolderS3(course.courseId, 'courses'));
});
