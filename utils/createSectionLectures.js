const Section = require('../models/sectionModel');
const Lecture = require('../models/lectureModel');

exports.createSectionsLectures = async (
  sections,
  courseId,
  instructorId,
  newCourse,
  req,
) => {
  req.body.sectionNo = 0;
  let videoIndex = 0;

  await sections.reduce(async (previousPromise, section) => {
    // Wait for the previous section to complete
    await previousPromise;

    const newSection = await Section.create({
      name: section.sectionName,
      courseId,
      instructorId,
    });

    const lectures = section.allLecture.map((lecture) => {
      return {
        name: lecture.lectureName,
        instructorId,
        sectionId: newSection.sectionId,
        courseId,
        duration: lecture.lectureDuration,
      };
    });

    // Create lectures for this section
    await Lecture.bulkCreate(lectures, {
      courseId,
      files: req.files,
      videoIndex: videoIndex,
      isUpdated: false,
      newCourse,
    });

    // videoIndex += section.allLecture.length;
    videoIndex += 1;

    // Return a resolved promise for the next iteration
    return Promise.resolve();
  }, Promise.resolve());
};
