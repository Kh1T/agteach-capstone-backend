const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const Lecture = require('../models/lectureModel');
const Section = require('../models/sectionModel');
const { uploadVideoToS3 } = require('./uploadMiddleware');
const s3Client = require('../config/s3Connection');

/**
 * Deletes a video from S3 with the given filename.
 *
 * @param {string} filename - The S3 key for the video.
 *
 * @returns {Promise<void>}
 */
const deleteVideoFromS3 = async (filename) => {
  const input = {
    Bucket: process.env.AWS_S3_ASSET_COURSE_BUCKET, // your bucket name
    Key: filename, // file path
  };

  await s3Client.send(new DeleteObjectCommand(input));
};

  /**
   * Process lectures for each section of a course.
   * 
   * @param {number} id - The ID of the course.
   * @param {Object} req - The Express request object.
   * @param {Object[]} parseAllSection - An array of section objects parsed from the request body.
   * @param {number} instructorId - The ID of the course instructor.
   * @param {Sequelize.Transaction} transaction - The Sequelize transaction object.
   * 
   * @returns {Promise<Object>} An object containing an array of new lectures, an array of updated lectures, and an array of lectures to delete.
   */
exports.processLectures = async (
  id,
  req,
  parseAllSection,
  instructorId,
  transaction,
) => {
  // Process sections individually (no bulk section creation)
  const newLectures = [];
  const updateLectures = [];
  const lecturesToDelete = []; 
  let sectionIdx = 0;
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
          updatedSection.isNewUpdateSection = false;
        }
      } else {
        updatedSection = await Section.create(
          {
            courseId: id,
            name: section.sectionName,
            instructorId,
            isNewUpdateSection: true,
          },
          { transaction },
        );
        updatedSection.isNewUpdateSection = true;
        updatedSection.sectionIdx = sectionIdx;
        sectionIdx += 1;
      }

      // Handle lectures for each section
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
      let lectureIdx = 0;
      await Promise.all(
        section.allLecture.map(async (lecture) => {
          if (lecture.lectureId) {
            const videoFile = req.files.find(
              (file) =>
                file.fieldname ===
                `videos[${section.sectionId}][${lecture.lectureId}]`,
            );



            // update video to S3 when there is a new video
            if (videoFile) {
              const filename = `courses/${id}/section-${section.sectionId}/lecture-${lecture.lectureId}.mp4`;
              uploadVideoToS3(filename, videoFile.buffer);
            }

            updateLectures.push({
              lectureId: lecture.lectureId,
              name: lecture.lectureName,
              duration: lecture.lectureDuration,
            });
          } else {
            // [sectionIdx, lectureIdx]
            let updatedSections = [];
            // if new section use sectionIdx
            if (updatedSection.isNewUpdateSection) {
              updatedSections = [updatedSection.sectionIdx, lectureIdx];
            } else {
              updatedSections = [updatedSection.sectionId, lectureIdx];
            }
            newLectures.push({
              sectionId: updatedSection.sectionId,
              name: lecture.lectureName,
              videoUrl: lecture.videoUrl,
              duration: lecture.lectureDuration,
              isNewUpdateSection: updatedSection.isNewUpdateSection,
              updatedSections,
            });
            lectureIdx += 1;
          }
        }),
      );
      // Delete lectures from S3 before deleting them from the database
      await Promise.all(
        lecturesToDelete.map(async (lectureId) => {
          const lecture = existingLectures.find(
            (lec) => lec.lectureId === lectureId,
          );
          if (lecture && lecture.videoUrl) {
            const filename = lecture.videoUrl.replace(
              process.env.AWS_S3_BUCKET_URL,
              '',
            ); // Get S3 key
            await deleteVideoFromS3(filename); // Delete from S3
          }
        }),
      );
    }),
  );
  return { newLectures, updateLectures, lecturesToDelete };
};
