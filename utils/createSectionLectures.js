const Section = require('../models/sectionModel');
const Lecture = require('../models/lectureModel');

exports.createSectionsLectures = async (sections, courseId, instructorId) => {
  const sectionLectures = sections.map(async (section) => {
    const newSection = await Section.create({
      name: section.sectionName,
      instructorId,
    });

    const lectures = section.allLecture.map((lecture) => ({
      name: lecture.lectureName,
      instructorId,
      sectionId: newSection.sectionId,
      courseId: courseId,
    }));

    return Lecture.bulkCreate(lectures);
  });

  return Promise.all(sectionLectures);
};
