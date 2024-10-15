const Lecture = require('../models/lectureModel');
const Section = require('../models/sectionModel');
const { uploadToS3 } = require('./uploadMiddleware');

exports.processLectures = async (
  id,
  req,
  parseAllSection,
  instructorId,
  transaction,
) => {
  // Step 4: Process sections individually (no bulk section creation)
  const newLectures = [];
  const updateLectures = [];
  const lecturesToDelete = [];
  // let videoIndex = 0;
  // Step 4: Process sections in parallel using Promise.all
  await Promise.all(
    parseAllSection.map(async (section) => {
      let updatedSection;

      if (section.sectionId) {
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
        updatedSection = await Section.create(
          {
            courseId: id,
            name: section.sectionName,
            instructorId,
          },
          { transaction },
        );
      }

      // Step 5: Handle lectures for each section
      const lectureIdsFromRequest = section.allLecture
        .map((lecture) => lecture.lectureId)
        .filter(Boolean);

      const existingLectures = await Lecture.findAll({
        where: { sectionId: updatedSection.sectionId },
        transaction,
      });

      const existingLectureIds = existingLectures.map(
        (lecture) => lecture.lectureId,
      );

      // Determine lectures to delete
      lecturesToDelete.push(
        ...existingLectureIds.filter(
          (lectureId) => !lectureIdsFromRequest.includes(lectureId),
        ),
      );

      // Process lectures in parallel
      await Promise.all(
        section.allLecture.map(async (lecture) => {
          if (lecture.lectureId) {
            const videoFile = req.files.find(
              (file) =>
                file.fieldname ===
                `videos[${section.sectionId}][${lecture.lectureId}]`,
            );

            // console.log('lecture:', lecture);
            // console.log('video:', videoFile);
            if (videoFile) {
              const filename = `courses/${id}/section-${section.sectionId}/lecture-${lecture.lectureId}.mp4`;
              // console.log('filename: ', filename);
              uploadToS3(filename, videoFile.buffer);
            }

            updateLectures.push({
              lectureId: lecture.lectureId,
              name: lecture.lectureName,
              duration: lecture.duration,
            });
          } else {
            newLectures.push({
              sectionId: updatedSection.sectionId,
              name: lecture.lectureName,
              videoUrl: lecture.videoUrl,
              duration: lecture.duration,
            });
          }
        }),
      );
    }),
  );
  return { newLectures, updateLectures, lecturesToDelete };
};
