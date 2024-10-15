const Lecture = require('../models/lectureModel');
const Section = require('../models/sectionModel');

exports.updateSectionLecture = async (
  id,
  parseAllSection,
  instructorId,
  req,
  transaction,
) => {
  // Step 2: Get existing sections for comparison
  const sectionIdsFromRequest = parseAllSection
    .map((section) => section.sectionId)
    .filter((sectionId) => !!sectionId);

  const existingSections = await Section.findAll({
    where: { courseId: id },
    transaction,
  });

  const existingSectionIds = existingSections.map(
    (section) => section.sectionId,
  );

  // Step 3: Delete sections that are not in the request
  const sectionsToDelete = existingSectionIds.filter(
    (sectionId) => !sectionIdsFromRequest.includes(sectionId),
  );
  if (sectionsToDelete.length > 0) {
    await Section.destroy({
      where: { sectionId: sectionsToDelete },
      transaction,
    });
  }

  // Step 4: Process sections and lectures using reduce
  const { newLectures, updateLectures, lecturesToDelete } = parseAllSection.reduce(
    (acc, section) => {
      acc.sectionsToProcess.push(
        (async () => {
          let updatedSection;

          if (section.sectionId) {
            // Update existing section
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
            // Create a new section
            updatedSection = await Section.create(
              {
                courseId: id,
                name: section.sectionName,
                instructorId,
              },
              { transaction },
            );
          }

          // Fetch all lectures for the section (store in map to avoid refetching)
          const existingLectures = await Lecture.findAll({
            where: { sectionId: updatedSection.sectionId },
            transaction,
          });

          const existingLectureIds = existingLectures.map(
            (lecture) => lecture.lectureId,
          );

          // Determine lectures to delete
          const lectureIdsFromRequest = section.allLecture
            .map((lecture) => lecture.lectureId)
            .filter(Boolean);

          acc.lecturesToDelete.push(
            ...existingLectureIds.filter(
              (id) => !lectureIdsFromRequest.includes(id),
            ),
          );

          // Process lectures for this section
          section.allLecture.forEach((lecture, index) => {
            if (lecture.lectureId) {
              // Collect updated lecture information
              acc.updateLectures.push({
                lectureId: lecture.lectureId,
                name: lecture.lectureName,
                duration: lecture.duration,
                videoUrl: req.files.find(
                  (file) =>
                    file.fieldname ===
                    `videos[${section.sectionId}][${lecture.lectureId}]`,
                )?.path || lecture.videoUrl, // Fallback to existing URL if no file
              });
            } else {
              // Collect new lectures for bulk creation
              acc.newLectures.push({
                sectionId: updatedSection.sectionId,
                name: lecture.lectureName,
                videoUrl: lecture.videoUrl,
                duration: lecture.duration,
              });
            }
          });
        })(),
      );

      return acc;
    },
    {
      newLectures: [],
      updateLectures: [],
      lecturesToDelete: [],
      sectionsToProcess: [],
    },
  );

  // Wait for all section processing promises to complete
  await Promise.all(newLectures.sectionsToProcess);

  // Step 6: Bulk create new lectures
  if (newLectures.length > 0) {
    await Lecture.bulkCreate(newLectures, {
      transaction,
    });
  }

  // Step 7: Bulk update lectures
  if (updateLectures.length > 0) {
    await Promise.all(
      updateLectures.map((lecture) =>
        Lecture.update(
          {
            name: lecture.name,
            videoUrl: lecture.videoUrl,
            duration: lecture.duration,
          },
          { where: { lectureId: lecture.lectureId }, transaction },
        ),
      ),
    );
  }

  // Step 8: Delete lectures that were not in the request
  if (lecturesToDelete.length > 0) {
    await Lecture.destroy({
      where: { lectureId: lecturesToDelete },
      transaction,
    });
  }
};