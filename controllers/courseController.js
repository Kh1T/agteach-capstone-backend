const Course = require('../models/courseModel');
const ProductSuggestion = require('../models/productSuggestionModel');
const Section = require('../models/sectionModel');
const SectionLecture = require('../models/sectionLectureModel');
const Instructor = require('../models/instructorModel');
const Lecture = require('../models/lectureModel');
const catchAsync = require('../utils/catchAsync');
const handleFactory = require('./handlerFactory');
const { uploadCourseVideos } = require('../utils/multerConfig');

exports.searchData = handleFactory.SearchData(Course);

exports.getAll = handleFactory.getAll(Course);
exports.deleteOne = handleFactory.deleteOne(Course);

exports.recommendCourse = handleFactory.recommendItems(
  Course,
  'courseId',
  'price',
  ['instructorId', 'name', 'price', 'thumbnailUrl'],
);

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
  const { instructorId } = await Instructor.findOne({
    where: { userUid: req.user.userUid },
    attributes: ['instructorId'],
  });

  // Destructure the course details and sections from the request body
  const {
    courseName,
    description,
    price,
    courseObjective,
    allSection,
    thumbnailUrl,
  } = req.body;

  const parseAllSection = JSON.parse(allSection);
  // Insert the course and retrieve its ID
  const newCourse = await Course.create({
    name: courseName,
    description,
    price,
    courseObjective,
    instructorId,
    thumbnailUrl,
  });

  // Insert sections and lectures in parallel
  const sectionLectureDataPromises = parseAllSection.map(async (section) => {
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
  const newSectionLectures = await SectionLecture.bulkCreate(
    sectionLectureData,
    req.files,
  );

  // Send the response with inserted data
  res.status(201).json({
    status: 'success',
    data: newSectionLectures,
  });
});

