const Course = require('../models/courseModel');
const ProductSuggestion = require('../models/productSuggestionModel');
const Section = require('../models/sectionModel');
const SectionLecture = require('../models/sectionLectureModel');
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
      { model: Section, include: [{ model: Lecture }] },
      { model: Instructor },
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

  const parsedSections = JSON.parse(allSection);
  const parsedProductSuggestions = !!ProductSuggestionId
    ? JSON.parse(ProductSuggestionId)
    : null;

  const newCourse = await Course.create({
    name: courseName,
    description,
    price,
    courseObjective,
    numberOfVideo: req.files.videos?.length,
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
    req,
  );

  res.status(201).json({
    status: 'success',
    message: 'Course and related data created successfully',
    data: newCourse,
  });
});

// })
// exports.updateCourse = catchAsync(async (req, res, next) => {
//   const { id } = req.params; // Assuming courseId is passed in the URL
//   const { instructorId } = await Instructor.findOne({
//     where: { userUid: req.user.userUid },
//     attributes: ['instructorId'],
//   });

//   // Destructure the updated course details and sections from the request body
//   const { courseName, description, price, courseObjective, allSection } =
//     req.body;
//   const parseAllSection = JSON.parse(allSection);

//   // Get file information (assuming Multer is used for file uploads)

//   // Find the course and update it
//   const course = await Course.findByPk(id);

//   if (!course) {
//     return next(new AppError('Course not found', 404));
//   }

//   // console.log(course);
//   // Update the course fields
//   await course.update({
//     name: courseName,
//     description,
//     price,
//     courseObjective,
//     numberOfVideo: req.files.videos.length,
//   });
//   // Fetch existing sections for this course
//   // const existingSectionLecture = await SectionLecture.findAll({
//   //   where: { courseId: course.courseId },
//   // });
//   const existingSectionLecture = await SectionLecture.findAll({
//     where: { courseId: course.courseId },
//   });
//   // console.log('existingSections: ', existingSections);
//   // Create a Set of existing section IDs for comparison
//   const existingSectionIds = new Set(
//     existingSectionLecture.map((section) => section.sectionId),
//   );
//   const existingLectureIds = new Set(
//     existingSectionLecture.map((section) => section.lectureId),
//   );
//   // Process sections and lectures from the updated course details
//   const sectionLectureDataPromises = parseAllSection.map(async (section) => {
//     let newSection;

//     // Check if section already exists by ID (assuming sectionId is passed in the request body for existing sections)
//     if (section.sectionId && existingSectionIds.has(section.sectionId)) {
//       // Update the existing section
//       newSection = await Section.findByPk(section.sectionId);
//       await newSection.update({
//         name: section.sectionName,
//       });

//       // Remove sectionId from the set as it's being updated
//       existingSectionIds.delete(section.sectionId);
//     } else {
//       // Create a new section if it doesn't exist
//       newSection = await Section.create({
//         name: section.sectionName,
//         instructorId,
//         courseId: course.courseId,
//       });
//     }

//     // Fetch existing lectures for this section
//     // Create or update lectures
//     const lecturePromises = section.allLecture.map(async (lecture) => {
//       let newLecture;

//       if (lecture.lectureId && existingLectureIds.has(lecture.lectureId)) {
//         // Update existing lecture
//         newLecture = await Lecture.findByPk(lecture.lectureId);
//         await newLecture.update({
//           name: lecture.lectureName,
//           video_url: lecture.videoUrl,
//           duration: lecture.duration,
//         });

//         // Remove lectureId from the set as it's being updated
//         existingLectureIds.delete(lecture.lectureId);
//       } else {
//         // Create new lecture
//         newLecture = await Lecture.create({
//           name: lecture.lectureName,
//           video_url: lecture.videoUrl,
//           duration: lecture.duration,
//           instructorId,
//           sectionId: newSection.sectionId,
//         });
//       }

//       return {
//         lectureId: newLecture.lectureId,
//         courseId: course.courseId,
//         sectionId: newSection.sectionId,
//         instructorId,
//       };
//     });

//     // Resolve all lecture promises
//     return Promise.all(lecturePromises);
//   });

//   // Resolve all section/lecture promises and flatten the resulting array
//   const sectionLectureData = (
//     await Promise.all(sectionLectureDataPromises)
//   ).flat();

//   // Bulk insert or update all SectionLecture relationships
//   await SectionLecture.bulkCreate(sectionLectureData, {
//     updateOnDuplicate: ['lectureId', 'sectionId', 'courseId', 'instructorId'],
//     videos: req.files.videos,
//     thumbnails: req.files.thumbnailUrl,
//   });

//   // Delete any sections and lectures that were not part of the update

//     if (existingLectureIds && existingLectureIds.size > 0) {
//       await Lecture.destroy({
//         where: { lectureId: Array.from(existingLectureIds) },
//       });
//     }

//   console.log('existingSectionIds: ', existingSectionIds)
//   if (existingSectionIds.size > 0) {
//     await Section.destroy({
//       where: { sectionId: Array.from(existingSectionIds) },
//     });
//   }

//   // Send the response with the updated course and sections/lectures data
//   res.status(200).json({
//     status: 'success',
//     data: {
//       course,
//       sectionLectureData,
//     },
//   });
// });

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
    const { instructorId } = await Instructor.findByPk(course.instructorId);

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
      where: { course_id: id },
      transaction,
    });

    const existingSectionIds = existingSections.map(
      (section) => section.section_id,
    );

    // Delete sections that are not in the request anymore
    const sectionsToDelete = existingSectionIds.filter(
      (id) => !sectionIdsFromRequest.includes(id),
    );
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
        updatedSection = await Section.findByPk(section.sectionId, { transaction });
        if (updatedSection) {
          await updatedSection.update({ name: section.sectionName }, { transaction });
        }
      } else {
        updatedSection = await Section.create(
          { courseId: id, name: section.sectionName, instructorId  },
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
    
      const existingLectureIds = existingLectures.map((lecture) => lecture.lectureId);
    
      // Delete lectures that are not present in the request
      const lecturesToDelete = existingLectureIds.filter(
        (id) => !lectureIdsFromRequest.includes(id),
      );
    
      const deletePromises = lecturesToDelete.length > 0 
        ? Lecture.destroy({ where: { lectureId: lecturesToDelete }, transaction })
        : [];
    
      // Process lecture updates/creations in parallel
      const lecturePromises = section.allLecture.map(async (lecture) => {
        if (lecture.lectureId) {
          const existingLecture = await Lecture.findByPk(lecture.lectureId, { transaction });
          if (existingLecture) {
            return existingLecture.update(
              {
                name: lecture.lectureName,
                video_url: lecture.videoUrl,
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
      message: 'Course, sections, and lectures updated successfully',
    });
  } catch (error) {
    // Rollback the transaction in case of an error
    await transaction.rollback();
    return next(error);
  }
});
