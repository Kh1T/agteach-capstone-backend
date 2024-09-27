const Course = require('../models/courseModel');
const Section = require('../models/sectionModel');
const SectionLecture = require('../models/sectionLectureModel');
const Instructor = require('../models/instructorModel');
const Lecture = require('../models/lectureModel');
const catchAsync = require('../utils/catchAsync');
const handleFactory = require('./handlerFactory');

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

  const newSection = await Section.create({
    name: sectionName,
    instructorId,
  });

  const newLecture = await Lecture.create({
    name: lectureName,
    instructorId,
  });

  const newSectionLecture = await SectionLecture.create({
    lectureId: newLecture.lectureId,
    courseId: newCourse.courseId,
    sectionId: newSection.sectionId,
    instructorId,
  });

  res.status(201).json({
    status: 'success',
    data: newLecture,
  });
});
