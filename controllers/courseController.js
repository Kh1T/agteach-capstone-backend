const Course = require('../models/courseModel');
const ProductSuggestion = require('../models/productSuggestionModel');
const Section = require('../models/sectionModel');
const SectionLecture = require('../models/sectionLectureModel');
const Instructor = require('../models/instructorModel');
const Lecture = require('../models/lectureModel');
const catchAsync = require('../utils/catchAsync');
const handleFactory = require('./handlerFactory');
const { uploadCourseVideos } = require('../utils/multerConfig');
const { createSectionsLectures } = require('../utils/createSectionLectures');
const { json } = require('sequelize');

exports.searchData = handleFactory.SearchData(Course);

exports.getAll = handleFactory.getAll(Course);
exports.deleteOne = handleFactory.deleteOne(Course);

exports.recommendCourse = handleFactory.recommendItems(
  Course,
  'courseId',
  'price',
  ['instructorId', 'name', 'price', 'thumbnailUrl'],
);

exports.getInstructorCourse = handleFactory.getUserItems(Course, Instructor);

exports.getOne = catchAsync(async (req, res, next) => {
  const course = await SectionLecture.findAll({
    where: { courseId: req.params.id },
    include: [{ model: Course }, { model: Section }, { model: Lecture }],
  });

  res.status(200).json({
    status: 'success',
    data: course,
  });
});

exports.uploadCourse = catchAsync(async (req, res, next) => {
  const {
    courseName,
    description,
    price,
    courseObjective,
    allSection,
    thumbnailUrl,
    ProductSuggestionId,
  } = req.body;

  const parsedSections = JSON.parse(allSection);
  const parsedProductSuggestions = JSON.parse(ProductSuggestionId);

  const newCourse = await Course.create({
    name: courseName,
    description,
    price,
    courseObjective,
    instructorId: req.instructorId,
    thumbnailUrl,
  });

  await ProductSuggestion.bulkCreate({
    courseId: newCourse.courseId,
    productId: parsedProductSuggestions,
    instructorId: req.instructorId,
  });

  await createSectionsLectures(
    parsedSections,
    newCourse.courseId,
    req.instructorId,
  );

  res.status(201).json({
    status: 'success',
    message: 'Course and related data created successfully',
  });
});
