const Course = require('../models/courseModel');
const Section = require('../models/sectionModel');
const SectionLecture = require('../models/sectionLectureModel');
const Instructor = require('../models/instructorModel');
const Lecture = require('../models/lectureModel');
const catchAsync = require('../utils/catchAsync');
const handleFactory = require('./handlerFactory');
const { uploadCourseVideos } = require('../utils/multerConfig');

exports.searchData = handleFactory.SearchData(Course);

exports.getAll = handleFactory.getAll(Course);
exports.getOne = handleFactory.getOne(Course);
exports.deleteOne = handleFactory.deleteOne(Course);

exports.uploadCourse = catchAsync(async (req, res, next) => {
  const { instructorId } = await Instructor.findOne({
    where: { userUid: req.user.userUid },
    attributes: ['instructorId'],
  });
  const {
    sectionName,
    lectureName,
    courseName,
    description,
    price,
    courseObjective,
  } = req.body;

  const newCourse = await Course.create({
    name: courseName,
    description,
    price,
    courseObjective,
    instructorId,
  });
  console.log(req.file);

  const newSection = await Section.create({
    name: sectionName,
    instructorId,
  });
  console.log(req.file);
  const newLecture = await Lecture.create({
    name: lectureName,
    instructorId,
  });

  const newSectionLecture = await SectionLecture.create(
    {
      lectureId: newLecture.lectureId,
      courseId: newCourse.courseId,
      sectionId: newSection.sectionId,
      instructorId,
    },
    {
      // Pass the file in options
      file: req.file, // Passing req.file in options
    },
  );

  res.status(201).json({
    status: 'success',
    data: newLecture,
  });
});

exports.uploadCourseVideo = uploadCourseVideos.single('video');
