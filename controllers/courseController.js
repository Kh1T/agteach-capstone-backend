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
const {
  processSection,
  deleteRemovedSections,
  processLectures,
} = require('../utils/updateSectionLectures');

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
    numberOfVideo,
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
      numberOfVideo,
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
      { transaction },
    );

    // Step 2: Delete sections that are not in the request
    const sectionIdsFromRequest = parsedSections
      .map((section) => section.sectionId)
      .filter(Boolean);
    await deleteRemovedSections(sectionIdsFromRequest, id, transaction);

    // Step 3: Process sections and their respective lectures
    // for (const section of parsedSections) {
    //   const updatedSection = await processSection(
    //     section,
    //     id,
    //     req.memberData.instructorId,
    //     transaction,
    //   );
    //   await processLectures(id, section, updatedSection, req, transaction);
    // }
    const sectionPromises = parsedSections.map(async (section) => {
      const updatedSection = await processSection(
        section,
        id,
        req.memberData.instructorId,
        transaction,
      );
      return processLectures(id, section, updatedSection, req, transaction);
    });

    const existingSectionIds = existingSections.map(
      (section) => section.sectionId,
    );

    // Step 3: Delete sections that are not in the request
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
      await handleLectures(id, req, parseAllSection, instructorId, transaction);
    // Step 4: Process sections individually (no bulk section creation)
    // const newLectures = [];
    // const updateLectures = [];
    // const lecturesToDelete = [];
    // let videoIndex = 0;
    // // Step 4: Process sections in parallel using Promise.all
    // await Promise.all(
    //   parseAllSection.map(async (section) => {
    //     let updatedSection;

    //     if (section.sectionId) {
    //       updatedSection = await Section.findByPk(section.sectionId, {
    //         transaction,
    //       });
    //       if (updatedSection) {
    //         await updatedSection.update(
    //           { name: section.sectionName },
    //           { transaction },
    //         );
    //       }
    //     } else {
    //       updatedSection = await Section.create(
    //         {
    //           courseId: id,
    //           name: section.sectionName,
    //           instructorId,
    //         },
    //         { transaction },
    //       );
    //     }

    //     // Step 5: Handle lectures for each section
    //     const lectureIdsFromRequest = section.allLecture
    //       .map((lecture) => lecture.lectureId)
    //       .filter(Boolean);

    //     const existingLectures = await Lecture.findAll({
    //       where: { sectionId: updatedSection.sectionId },
    //       transaction,
    //     });

    //     const existingLectureIds = existingLectures.map(
    //       (lecture) => lecture.lectureId,
    //     );

    //     // Determine lectures to delete
    //     lecturesToDelete.push(
    //       ...existingLectureIds.filter(
    //         (id) => !lectureIdsFromRequest.includes(id),
    //       ),
    //     );

    //     // Process lectures in parallel
    //     await Promise.all(
    //       section.allLecture.map(async (lecture, index) => {
    //         if (lecture.lectureId) {
    //           const videoFile = req.files.find(
    //             (file) =>
    //               file.fieldname ===
    //               `videos[${section.sectionId}][${lecture.lectureId}]`,
    //           );

    //           updateLectures.push({
    //             lectureId: lecture.lectureId,
    //             name: lecture.lectureName,
    //             duration: lecture.duration,
    //           });
    //         } else {
    //           newLectures.push({
    //             sectionId: updatedSection.sectionId,
    //             name: lecture.lectureName,
    //             videoUrl: lecture.videoUrl,
    //             duration: lecture.duration,
    //           });
    //         }
    //       }),
    //     );
    //   }),
    // );

    // Step 6: Bulk create new lectures
    if (newLectures.length > 0) {
      await Lecture.bulkCreate(newLectures, {
        courseId: id,
        files: req.files,
        isUpdated: true,
        transaction,
      });
      // console.log('videoIndex', newLectures)
    }

    // Step 7: Bulk update lectures
    if (updateLectures.length > 0) {
      await Promise.all(
        updateLectures.map((lecture) => {
          return Lecture.update(
            {
              name: lecture.name,
              videoUrl: lecture.videoUrl,
              duration: lecture.duration,
            },
            { where: { lectureId: lecture.lectureId }, transaction },
          );
        }),
      );
    }

    // Step 8: Delete lectures that were not in the request
    if (lecturesToDelete.length > 0) {
      await Lecture.destroy({
        where: { lectureId: lecturesToDelete },
        transaction,
      });
    }

    // Step 9: Commit transaction
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

//Step 4 to function
async function handleLectures(
  id,
  req,
  parseAllSection,
  instructorId,
  transaction,
) {
  // Step 4: Process sections individually (no bulk section creation)
  const newLectures = [];
  const updateLectures = [];
  const lecturesToDelete = [];
  let videoIndex = 0;
  // Step 4: Process sections in parallel using Promise.all
  await Promise.all(
    parseAllSection.map(async (section) => {
      let updatedSection;

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
          {
            courseId: id,
            name: section.sectionName,
            instructorId,
          },
          { transaction },
        );
      }

      // Step 5: Handle lectures for each section
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

      // Determine lectures to delete
      lecturesToDelete.push(
        ...existingLectureIds.filter(
          (id) => !lectureIdsFromRequest.includes(id),
        ),
      );

      // Process lectures in parallel
      await Promise.all(
        section.allLecture.map(async (lecture, index) => {
          if (lecture.lectureId) {
            const videoFile = req.files.find(
              (file) =>
                file.fieldname ===
                `videos[${section.sectionId}][${lecture.lectureId}]`,
            );
            console.log('lecture:', lecture);
            console.log('video:', videoFile);

            updateLectures.push({
              lectureId: lecture.lectureId,
              name: lecture.lectureName,
              duration: lecture.duration,
            });
          } else {
            newLectures.push({
              sectionId: updatedSection.sectionId,
              name: lecture.lectureName,
              videoUrl: lecture.videoUrl,
              duration: lecture.duration,
            });
          }
        }),
      );
    }),
  );
  return { newLectures, updateLectures, lecturesToDelete };
}
