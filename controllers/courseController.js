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
  const { courseName, description, price, courseObjective, allSection } =
    req.body;

  // Parse the incoming sections and lectures data
  const parseAllSection = JSON.parse(allSection);

  // Start a transaction to ensure consistency
  const transaction = await sequelize.transaction();

  try {
    // Step 1: Update the course details
    const course = await Course.findByPk(id);
    if (!course) {
      return next(new AppError('Course not found', 404));
    }
    // const { instructorId } = await Instructor.findByPk(course.instructorId);
    const { instructorId } = req.memberData;
    await course.update(
      {
        name: courseName,
        description,
        price,
        courseObjective,
      },
      { transaction },
    );

    // Step 2: Update the sections and lectures

    const sectionIdsFromRequest = parseAllSection
      .map((section) => section.sectionId)
      .filter((id) => !!id);

    // Get all existing sections for the course
    const existingSections = await Section.findAll({
      where: { courseId: id },
      transaction,
    });

    const existingSectionIds = existingSections.map(
      (section) => section.sectionId,
    );
    console.log('existingSectionsID:', existingSectionIds);

    // Delete sections that are not in the request anymore
    const sectionsToDelete = existingSectionIds.filter(
      (id) => !sectionIdsFromRequest.includes(id),
    );
    console.log('sectionsToDelete:', sectionsToDelete);
    if (sectionsToDelete.length > 0) {
      await Section.destroy({
        where: { sectionId: sectionsToDelete },
        transaction,
      });
    }

    // Step 3: Iterate through the request sections
    const sectionPromises = parseAllSection.map(async (section) => {
      let updatedSection;

      // Update or create section
      if (section.sectionId) {
        updatedSection = await Section.findByPk(section.sectionId, {
          transaction,
        });
        if (updatedSection) {
          await updatedSection.update(
            { name: section.sectionName },
            { transaction },
          );
        }
      } else {
        updatedSection = await Section.create(
          { courseId: id, name: section.sectionName, instructorId },
          { transaction },
        );
      }

      // Fetch existing lectures for the section
      const lectureIdsFromRequest = section.allLecture
        .map((lecture) => lecture.lectureId)
        .filter(Boolean);

      const existingLectures = await Lecture.findAll({
        where: { sectionId: updatedSection.sectionId },
        transaction,
      });

      const existingLectureIds = existingLectures.map(
        (lecture) => lecture.lectureId,
      );

      // Delete lectures that are not present in the request
      const lecturesToDelete = existingLectureIds.filter(
        (id) => !lectureIdsFromRequest.includes(id),
      );

      const deletePromises =
        lecturesToDelete.length > 0
          ? Lecture.destroy({
              where: { lectureId: lecturesToDelete },
              transaction,
            })
          : [];

      // Process lecture updates/creations in parallel
      console.log('Processing section:', section);
      const lecturePromises = section.allLecture.map(async (lecture) => {
        // Log lecture information for debugging
        console.log('Processing Lecture:', lecture);

        if (lecture.lectureId) {
          const existingLecture = await Lecture.findByPk(lecture.lectureId, {
            transaction,
          });
          if (existingLecture) {
            return existingLecture.update(
              {
                name: lecture.lectureName,
                videoUrl: lecture.videoUrl,
                duration: lecture.duration,
              },
              { transaction },
            );
          }
        } else {
          return Lecture.create(
            {
              sectionId: updatedSection.sectionId,
              name: lecture.lectureName,
              videoUrl: lecture.videoUrl,
              duration: lecture.duration,
            },
            { transaction },
          );
        }
      });

      // Resolve all delete and lecture creation/update promises
      await Promise.all([deletePromises, ...lecturePromises]);
    });

    // Execute all section-related promises in parallel
    await Promise.all(sectionPromises);

    // Commit the transaction after everything is done
    await transaction.commit();

    res.status(200).json({
      status: 'success',
      message: course,
    });
  } catch (error) {
    // Rollback the transaction in case of an error
    await transaction.rollback();
    return next(error);
  }
});
