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

  const bulkData = req.body;

  // Prepare arrays for each table's data
  const courseData = bulkData.map((item) => ({
    name: item.courseName,
    description: item.description,
    price: item.price,
    courseObjective: item.courseObjective,
    instructorId,
  }));

  const sectionData = bulkData.map((item) => ({
    name: item.sectionName,
    instructorId,
  }));

  const lectureData = bulkData.map((item) => ({
    name: item.lectureName,
    instructorId,
  }));

  // Insert into Course, Section, and Lecture tables
  const newCourses = await Course.bulkCreate(courseData, { returning: true });
  const newSections = await Section.bulkCreate(sectionData, {
    returning: true,
  });
  const newLectures = await Lecture.bulkCreate(lectureData, {
    returning: true,
  });

  // Create SectionLecture relationships based on inserted records
  const sectionLectureData = newCourses.map((course, index) => ({
    lectureId: newLectures[index].lectureId,
    courseId: course.courseId,
    sectionId: newSections[index].sectionId,
    instructorId,
  }));

  // Insert into SectionLecture table
  const newSectionLectures =
    await SectionLecture.bulkCreate(sectionLectureData);

  // Send the response with inserted data
  res.status(201).json({
    status: 'success',
    data: newSectionLectures,
  });
});
