const Lecture = require('../models/lectureModel');
const Section = require('../models/sectionModel');

// Helper function to create or update sections
const processSection = async (section, courseId, instructorId, transaction) => {
  let updatedSection;

  if (section.sectionId) {
    updatedSection = await Section.findByPk(section.sectionId, { transaction });
    if (updatedSection) {
      await updatedSection.update(
        { name: section.sectionName },
        { transaction },
      );
    }
  } else {
    updatedSection = await Section.create(
      { courseId, name: section.sectionName, instructorId },
      { transaction },
    );
  }

  return updatedSection;
};

// Helper function to handle lectures (creation, update, and deletion)
const processLectures = async (section, updatedSection, req, transaction) => {
  const { allLecture } = section;
  const newLectures = [];
  const updateLectures = [];
  const lecturesToDelete = [];

  const lectureIdsFromRequest = allLecture
    .map((lecture) => lecture.lectureId)
    .filter(Boolean);
  const existingLectures = await Lecture.findAll({
    where: { sectionId: updatedSection.sectionId },
    transaction,
  });
  const existingLectureIds = existingLectures.map(
    (lecture) => lecture.lectureId,
  );

  // Lectures to be deleted
  lecturesToDelete.push(
    ...existingLectureIds.filter((id) => !lectureIdsFromRequest.includes(id)),
  );

  // Handle each lecture
  for (let index = 0; index < allLecture.length; index++) {
    const lecture = allLecture[index];

    if (lecture.lectureId) {
      // Update existing lecture
      updateLectures.push({
        lectureId: lecture.lectureId,
        name: lecture.lectureName,
        duration: lecture.duration,
      });
    } else {
      // Collect new lectures
      newLectures.push({
        sectionId: updatedSection.sectionId,
        name: lecture.lectureName,
        videoUrl: lecture.videoUrl,
        duration: lecture.duration,
        videoIndex: index,
      });
    }
  }

  // Perform bulk creation of new lectures
  if (newLectures.length > 0) {
    await Lecture.bulkCreate(newLectures, { transaction });
  }

  // Update existing lectures
  if (updateLectures.length > 0) {
    await Promise.all(
      updateLectures.map((lecture) =>
        Lecture.update(
          {
            name: lecture.name,
            duration: lecture.duration,
            videoUrl: lecture.videoUrl,
          },
          { where: { lectureId: lecture.lectureId }, transaction },
        ),
      ),
    );
  }

  // Delete lectures that were not included in the request
  if (lecturesToDelete.length > 0) {
    await Lecture.destroy({
      where: { lectureId: lecturesToDelete },
      transaction,
    });
  }
};

// Helper function to handle section deletion
const deleteRemovedSections = async (
  sectionIdsFromRequest,
  courseId,
  transaction,
) => {
  const existingSections = await Section.findAll({
    where: { courseId },
    transaction,
  });
  const existingSectionIds = existingSections.map(
    (section) => section.sectionId,
  );

  const sectionsToDelete = existingSectionIds.filter(
    (id) => !sectionIdsFromRequest.includes(id),
  );

  if (sectionsToDelete.length > 0) {
    await Section.destroy({
      where: { sectionId: sectionsToDelete },
      transaction,
    });
  }
};

module.exports = { processSection, processLectures, deleteRemovedSections };
