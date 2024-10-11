const Section = require('../models/sectionModel');
const Lecture = require('../models/lectureModel');

exports.createSectionsLectures = async (sections, courseId, instructorId,req) => {
  const sectionLectures = sections.map(async (section) => {
    const newSection = await Section.create({
      name: section.sectionName,
      courseId,
      instructorId,
      courseId,
    });

    const lectures = section.allLecture.map((lecture) => ({
      name: lecture.lectureName,
      instructorId,
      sectionId: newSection.sectionId,
      courseId,
    }));

    return Lecture.bulkCreate(lectures, {videos: req.files.videos, thumbnails: req.files.thumbnailUrl});
  });

  return Promise.all(sectionLectures);
};
