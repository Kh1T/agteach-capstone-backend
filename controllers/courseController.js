const Course = require('../models/courseModel');
const Section = require('../models/sectionModel');
const SectionLecture = require('../models/sectionLectureModel');
const Instructor = require('../models/instructorModel');
const Lecture = require('../models/lectureModel');
const catchAsync = require('../utils/catchAsync');
const handleFactory = require('./handlerFactory');
const { uploadCourseVideos } = require('../utils/multerConfig');
const AppError = require('../utils/appError');

exports.searchData = handleFactory.SearchData(Course);

exports.getAll = handleFactory.getAll(Course);
exports.getOne = handleFactory.getOne(Course);
exports.deleteOne = handleFactory.deleteOne(Course);

exports.recommendCourse = handleFactory.recommendItems(
  Course,
  'courseId',
  'price',
  ['instructorId', 'name', 'price', 'thumbnailUrl'],
);

exports.uploadCourse = catchAsync(async (req, res, next) => {
  const { instructorId } = await Instructor.findOne({
    where: { userUid: req.user.userUid },
    attributes: ['instructorId'],
  });

  // Destructure the course details and sections from the request body
  const { courseName, description, price, courseObjective, allSection } =
    req.body;
  const parseAllSection = JSON.parse(allSection);
  // Insert the course and retrieve its ID
  const newCourse = await Course.create({
    name: courseName,
    description,
    price,
    courseObjective,
    instructorId,
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
  const newSectionLectures =
    await SectionLecture.bulkCreate(sectionLectureData, req.files);


  // Send the response with inserted data
  res.status(201).json({
    status: 'success',
    data: newSectionLectures,
  });
});

exports.updateCourse = catchAsync(async (req, res, next) => {
  const { courseId } = req.params;
  const { name, description, price, courseObjective } = req.body;
  const course = await Course.findByPk(courseId);
  if (!course) {
    return next(new AppError('No course found with that ID', 404));
  }
  course.name = name;
  course.description = description;
  course.price = price;
  course.courseObjective = courseObjective;
  await course.save();
  res.status(200).json({
    status: 'success',
    data: course,
  });
})
