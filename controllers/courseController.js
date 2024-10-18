const { json } = require('sequelize');
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
const { processLectures } = require('../utils/updateSectionLecture');

const createProductSuggestions = (courseId, instructorId, productIds) =>
  productIds.map((productId) => ({
    courseId,
    productId,
    instructorId,
  }));

exports.searchData = handleFactory.SearchData(Course);

exports.getAll = handleFactory.getAll(Course);
exports.deleteOne = handleFactory.deleteOne(Course);

exports.recommendCourse = handleFactory.recommendItems(
  Course,
  'courseId',
  'price',
  ['instructorId', 'courseId', 'name', 'price', 'thumbnailUrl'],
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
    order: [
      [{ model: Section }, 'sectionId', 'ASC'],
      [Section, { model: Lecture }, 'lectureId', 'ASC'],
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
    numberOfVideo,
    totalDuration,
  } = req.body;

  // let allLecture = JSON.parse(req.body.allSection)
  // console.log('lecture', allLecture[0].allLecture)
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
      numberOfVideo,
      instructorId,
      thumbnailUrl,
      duration: totalDuration,
    },
    { files: req.files },
  );
  // createProductSuggestions;

  const suggestions = createProductSuggestions(
    newCourse.courseId,
    instructorId,
    parsedProductSuggestions,
  );

  await ProductSuggestion.bulkCreate(suggestions);

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
  const {
    courseName,
    description,
    price,
    courseObjective,
    ProductSuggestionId,
    allSection,
    totalDuration,
    thumbnailUrl,
  } = req.body;

  const parseAllSection = JSON.parse(allSection);
  const transaction = await sequelize.transaction();
  console.log(totalDuration);
  const parseUpdateProductSuggestions = JSON.parse(ProductSuggestionId);
  try {
    //Update the course details
    const course = await Course.findByPk(id);
    if (!course) {
      return next(new AppError('Course not found', 404));
    }

    const { instructorId } = req.memberData;
    await course.update(
      {
        name: courseName,
        description,
        price,
        duration: totalDuration,
        courseObjective,
      },
      { files: req.files, transaction },
    );

    if (parseUpdateProductSuggestions) {
      // Find existing product suggestions for the course
      const existingSuggestions = await ProductSuggestion.findAll({
        where: { courseId: id },
      });

      // Delete existing suggestions not in the updated list
      const existingSuggestionIds = existingSuggestions.map(
        (suggestion) => suggestion.productSuggestionId,
      );
      const suggestionsToDelete = existingSuggestionIds.filter(
        (suggestionId) => !parseUpdateProductSuggestions.includes(suggestionId),
      );

      if (suggestionsToDelete.length > 0) {
        await ProductSuggestion.destroy({
          where: { productSuggestionId: suggestionsToDelete },
        });
      }

      // Add or update new suggestions
      const newSuggestions = parseUpdateProductSuggestions.map((productId) => ({
        courseId: id,
        productId,
        instructorId,
      }));

      await ProductSuggestion.bulkCreate(newSuggestions, {
        updateOnDuplicate: ['productId', 'courseId', 'instructorId'], // Fields to update if a record already exists
      });
    }

    // Get existing sections for comparison
    const sectionIdsFromRequest = parseAllSection
      .map((section) => section.sectionId)
      .filter((id) => !!id);

    const existingSections = await Section.findAll({
      where: { courseId: id },
      transaction,
    });

    const existingSectionIds = existingSections.map(
      (section) => section.sectionId,
    );

    //  Delete sections that are not in the request
    const sectionsToDelete = existingSectionIds.filter(
      (id) => !sectionIdsFromRequest.includes(id),
    );
    if (sectionsToDelete.length > 0) {
      await Section.destroy({
        where: { sectionId: sectionsToDelete },
        transaction,
      });
    }

    const { newLectures, updateLectures, lecturesToDelete } =
      await processLectures(
        id,
        req,
        parseAllSection,
        instructorId,
        transaction,
      );

    // Bulk create new lectures
    if (newLectures.length > 0) {
      await Lecture.bulkCreate(newLectures, {
        courseId: id,
        files: req.files,
        isUpdated: true,
        transaction,
      });
      // console.log('videoIndex', newLectures)
    }

    // Bulk update lectures
    if (updateLectures.length > 0) {
      await Promise.all(
        updateLectures.map((lecture) =>
          Lecture.update(
            {
              name: lecture.name,
              videoUrl: lecture.videoUrl,
              duration: lecture.lectureDuration,
            },
            { where: { lectureId: lecture.lectureId }, transaction },
          ),
        ),
      );
    }

    // Delete lectures that were not in the request
    if (lecturesToDelete.length > 0) {
      await Lecture.destroy({
        where: { lectureId: lecturesToDelete },
        transaction,
      });
    }

    //  Commit transaction
    await transaction.commit();

    res.status(200).json({
      status: 'success',
      message: course,
    });
  } catch (error) {
    // Rollback the transaction in case of error
    await transaction.rollback();
    return next(error);
  }
});
