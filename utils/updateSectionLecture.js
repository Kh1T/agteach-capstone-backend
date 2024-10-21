const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const Lecture = require('../models/lectureModel');
const Section = require('../models/sectionModel');
const { uploadToS3 } = require('./uploadMiddleware');
const s3Client = require('../config/s3Connection');

const deleteFromS3 = async (filename) => {
  const input = {
    Bucket: process.env.AWS_S3_ASSET_BUCKET, // your bucket name
    Key: filename, // file path
  };

  await s3Client.send(new DeleteObjectCommand(input));
};

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
      let lectureIdx = 0;
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

            // update video to S3 when there is a new video
            if (videoFile) {
              const filename = `courses/${id}/section-${section.sectionId}/lecture-${lecture.lectureId}.mp4`;
              // console.log('filename: ', filename);
              uploadToS3(filename, videoFile.buffer);
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
            await deleteFromS3(filename); // Delete from S3
          }
        }),
      );
    }),
  );
  return { newLectures, updateLectures, lecturesToDelete };
};
