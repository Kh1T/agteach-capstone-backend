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
const sequelize = require('../config/db');
const { json } = require('sequelize');
const { processSection, deleteRemovedSections, processLectures } = require('../utils/updateSectionLectures');

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
      {
        model: Section,
        include: [{ model: Lecture }],
      },
      { model: Instructor },
      { model: ProductSuggestion, include: [{ model: Product }] },
    ],
    order: [[{ model: Section }, 'sectionId', 'ASC']],
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
    totalDuration,
  } = req.body;

  const { instructorId } = req.memberData;

  const parsedSections = JSON.parse(allSection);
  const parsedProductSuggestions = !!ProductSuggestionId
    ? JSON.parse(ProductSuggestionId)
    : null;

  const newCourse = await Course.create(
    {
      name: courseName,
      description,
      price,
      courseObjective,
      numberOfVideo: req.files.videos?.length,
      instructorId: req.instructorId,
      thumbnailUrl,
      duration: totalDuration,
    },
    { files: req.files },
  );

  await ProductSuggestion.bulkCreate({
    courseId: newCourse.courseId,
    productId: parsedProductSuggestions,
    instructorId,
  });

  await createSectionsLectures(
    parsedSections,
    newCourse.courseId,
    instructorId,
    req,
  );

  res.status(201).json({
    status: 'success',
    message: 'Course and related data created successfully',
    data: newCourse,
  });
});

exports.updateCourse = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { courseName, description, price, courseObjective, allSection } = req.body;
  const parsedSections = JSON.parse(allSection);
  const transaction = await sequelize.transaction();

  try {
    // Step 1: Update the course details
    const course = await Course.findByPk(id);
    if (!course) {
      return next(new AppError('Course not found', 404));
    }

    await course.update(
      { name: courseName, description, price, courseObjective },
      { transaction }
    );

    // Step 2: Delete sections that are not in the request
    const sectionIdsFromRequest = parsedSections
      .map((section) => section.sectionId)
      .filter(Boolean);
    await deleteRemovedSections(sectionIdsFromRequest, id, transaction);

    // Step 3: Process sections and their respective lectures
    for (const section of parsedSections) {
      const updatedSection = await processSection(section, id, req.memberData.instructorId, transaction);
      await processLectures(section, updatedSection, req, transaction);
    }

    // Step 4: Commit transaction
    await transaction.commit();

    res.status(200).json({
      status: 'success',
      message: course,
    });
  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    return next(error);
  }
});

