const Course = require('../models/courseModel');
const ProductSuggestion = require('../models/productSuggestionModel');
const Product = require('../models/productModel');
const Section = require('../models/sectionModel');
const Instructor = require('../models/instructorModel');
const Lecture = require('../models/lectureModel');
const catchAsync = require('../utils/catchAsync');
const handleFactory = require('./handlerFactory');
const { createSectionsLectures } = require('../utils/createSectionLectures');
const AppError = require('../utils/appError');

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
  const course = await Course.findOne({
    where: { courseId: req.params.id },
    include: [
      { model: Section, include: [{ model: Lecture }] },
      { model: Instructor },
      { model: ProductSuggestion, include: [{ model: Product }] },
    ],
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

  const { instructorId } = req.memberData;

  const parsedSections = JSON.parse(allSection);
  const parsedProductSuggestions = !!ProductSuggestionId
    ? JSON.parse(ProductSuggestionId)
    : null;

  const newCourse = await Course.create({
    name: courseName,
    description,
    price,
    courseObjective,
    instructorId,
    numberOfVideo: req.files.videos.length,
  });

  await ProductSuggestion.bulkCreate({
    courseId: newCourse.courseId,
    productId: parsedProductSuggestions,
    instructorId,
  });

  await createSectionsLectures(
    parsedSections,
    newCourse.courseId,
    instructorId,
  );

  res.status(201).json({
    status: 'success',
    message: 'Course and related data created successfully',
    data: newCourse,
  });
});
