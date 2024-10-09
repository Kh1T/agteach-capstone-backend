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
    numberOfVideo: req.files.videos.length,
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

// exports.updateCourse = catchAsync(async (req, res, next) => {
//   const { courseId } = req.params;
//   const { name, description, price, courseObjective } = req.body;
//   const course = await Course.findByPk(courseId);
//   if (!course) {
//     return next(new AppError('No course found with that ID', 404));
//   }
//   course.name = name;
//   course.description = description;
//   course.price = price;
//   course.courseObjective = courseObjective;
//   await course.save();
//   res.status(200).json({
//     status: 'success',
//     data: course,
//   });
// })
exports.updateCourse = catchAsync(async (req, res, next) => {
  const { id } = req.params; // Assuming courseId is passed in the URL
  const { instructorId } = await Instructor.findOne({
    where: { userUid: req.user.userUid },
    attributes: ['instructorId'],
  });

  // Destructure the updated course details and sections from the request body
  const { courseName, description, price, courseObjective, allSection } =
    req.body;
  const parseAllSection = JSON.parse(allSection);

  // Get file information (assuming Multer is used for file uploads)
  const { previewVideo, thumbnail } = req.files;

  // Find the course and update it
  const course = await Course.findByPk(id);

  if (!course) {
    return next(new Error('Course not found'));
  }

  // console.log(course);
  // Update the course fields
  await course.update({
    name: courseName,
    description,
    price,
    courseObjective,
    numberOfVideo: req.files.videos.length,    
    // other fields can be updated similarly...
  });
  // Fetch existing sections for this course
  const existingSectionLecture = await SectionLecture.findAll({
    where: { courseId: course.courseId },
  });
  // console.log('existingSections: ', existingSections);
  // Create a Set of existing section IDs for comparison
  const existingSectionIds = new Set(
    existingSectionLecture.map((section) => section.sectionId),
  );
  const existingLectureIds = new Set(
    existingSectionLecture.map((section) => section.lectureId),
  );
  // Process sections and lectures from the updated course details
  const sectionLectureDataPromises = parseAllSection.map(async (section) => {
    let newSection;

    // Check if section already exists by ID (assuming sectionId is passed in the request body for existing sections)
    if (section.sectionId && existingSectionIds.has(section.sectionId)) {
      // Update the existing section
      newSection = await Section.findByPk(section.sectionId);
      await newSection.update({
        name: section.sectionName,
      });

      // Remove sectionId from the set as it's being updated
      existingSectionIds.delete(section.sectionId);
    } else {
      // Create a new section if it doesn't exist
      newSection = await Section.create({
        name: section.sectionName,
        instructorId,
        courseId: course.courseId,
      });
    }

    // Fetch existing lectures for this section
    // const existingLectures = await Lecture.findAll({ where: { sectionId: newSection.sectionId } });
    // const existingLectureIds = new Set(existingLectures.map(lecture => lecture.lectureId));

    // Create or update lectures
    const lecturePromises = section.allLecture.map(async (lecture) => {
      let newLecture;

      if (lecture.lectureId && existingLectureIds.has(lecture.lectureId)) {
        // Update existing lecture
        newLecture = await Lecture.findByPk(lecture.lectureId);
        await newLecture.update({
          name: lecture.lectureName,
          video_url: lecture.videoUrl, // Assuming lecture.videoUrl is passed
          duration: lecture.duration, // Assuming lecture.duration is passed
        });

        // Remove lectureId from the set as it's being updated
        existingLectureIds.delete(lecture.lectureId);
      } else {
        // Create new lecture
        newLecture = await Lecture.create({
          name: lecture.lectureName,
          video_url: lecture.videoUrl, // Assuming lecture.videoUrl is passed
          duration: lecture.duration, // Assuming lecture.duration is passed
          instructorId,
          sectionId: newSection.sectionId,
        });
      }

      return {
        lectureId: newLecture.lectureId,
        courseId: course.courseId,
        sectionId: newSection.sectionId,
        instructorId,
      };
    });

    // Resolve all lecture promises
    return Promise.all(lecturePromises);
  });

  // Resolve all section/lecture promises and flatten the resulting array
  const sectionLectureData = (
    await Promise.all(sectionLectureDataPromises)
  ).flat();

  // Bulk insert or update all SectionLecture relationships
  await SectionLecture.bulkCreate(sectionLectureData, {
    updateOnDuplicate: ['lectureId', 'sectionId', 'courseId', 'instructorId'],
    videos: req.files.videos,
    thumbnails: req.files.thumbnailUrl,
  });

  // Delete any sections and lectures that were not part of the update
  
    if (existingLectureIds && existingLectureIds.size > 0) {
      await Lecture.destroy({
        where: { lectureId: Array.from(existingLectureIds) },
      });
    }

  console.log('existingSectionIds: ', existingSectionIds)
  if (existingSectionIds.size > 0) {
    await Section.destroy({
      where: { sectionId: Array.from(existingSectionIds) },
    });
  }

  // Send the response with the updated course and sections/lectures data
  res.status(200).json({
    status: 'success',
    data: {
      course,
      sectionLectureData,
    },
  });
});

