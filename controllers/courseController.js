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

// exports.uploadCourse = catchAsync(async (req, res, next) => {
//   const { instructorId } = await Instructor.findOne({
//     where: { userUid: req.user.userUid },
//     attributes: ['instructorId'],
//   });

//   const bulkData = req.body;

//   // Prepare arrays for each table's data
//   const courseData = bulkData.map((item) => ({
//     name: item.courseName,
//     description: item.description,
//     price: item.price,
//     courseObjective: item.courseObjective,
//     instructorId,
//   }));

//   const sectionData = bulkData.map((item) => ({
//     name: item.sectionName,
//     instructorId,
//   }));

//   const lectureData = bulkData.map((item) => ({
//     name: item.lectureName,
//     instructorId,
//   }));

//   // Insert into Course, Section, and Lecture tables
//   const newCourses = await Course.bulkCreate(courseData, { returning: true });
//   const newSections = await Section.bulkCreate(sectionData, {
//     returning: true,
//   });
//   const newLectures = await Lecture.bulkCreate(lectureData, {
//     returning: true,
//   });

//   // Create SectionLecture relationships based on inserted records
//   const sectionLectureData = newCourses.map((course, index) => ({
//     lectureId: newLectures[index].lectureId,
//     courseId: course.courseId,
//     sectionId: newSections[index].sectionId,
//     instructorId,
//   }));

//   // Insert into SectionLecture table
//   const newSectionLectures =
//     await SectionLecture.bulkCreate(sectionLectureData);

//   // Send the response with inserted data
//   res.status(201).json({
//     status: 'success',
//     data: newSectionLectures,
//   });
// });

exports.uploadCourse = catchAsync(async (req, res, next) => {
  const { instructorId } = await Instructor.findOne({
    where: { userUid: req.user.userUid },
    attributes: ['instructorId'],
  });

  // Destructure the course details and sections from the request body
  const { courseName, description, price, courseObjective, allSection } =
    req.body;

  // Insert the course and retrieve its ID
  const newCourse = await Course.create({
    name: courseName,
    description,
    price,
    courseObjective,
    instructorId,
  });

  // Insert sections and lectures in parallel
  const sectionLectureDataPromises = allSection.map(async (section) => {
    // Create the section and retrieve its ID
    const newSection = await Section.create({
      name: section.sectionName,
      instructorId,
    });

    // Create lectures associated with this section
    const lecturePromises = section.allLecture.map(async (lecture) => {
      const newLecture = await Lecture.create({
        name: lecture.lectureName,
        instructorId,
      });

      // Return SectionLecture data for bulk insertion later
      return {
        lectureId: newLecture.lectureId,
        courseId: newCourse.courseId,
        sectionId: newSection.sectionId,
        instructorId,
      };
    });

    // Resolve all lecture promises for the current section
    return Promise.all(lecturePromises);
  });

  // Resolve all section/lecture creation promises and flatten the resulting array
  const sectionLectureData = (
    await Promise.all(sectionLectureDataPromises)
  ).flat();

  // Bulk insert all SectionLecture relationships at once
  const newSectionLectures =
    await SectionLecture.bulkCreate(sectionLectureData);

  // Send the response with inserted data
  res.status(201).json({
    status: 'success',
    data: newSectionLectures,
  });
});
