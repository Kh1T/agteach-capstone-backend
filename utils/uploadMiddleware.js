const sharp = require('sharp');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const { getVideoDurationInSeconds } = require('get-video-duration');
const fs = require('fs');

const catchAsync = require('./catchAsync');
const s3Client = require('../config/s3Connection');
const Lecture = require('../models/lectureModel');
const AppError = require('./appError');
const Course = require('../models/courseModel');

// Upload Profile Image
// Need User role from protected route
const resizeUploadProfileImage = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  req.file.filename = `${req.user.role}s/${req.user.userUid}/profile-image.jpeg`;

  const buffer = await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toBuffer();

  const input = {
    Bucket: process.env.AWS_S3_ASSET_BUCKET,
    Key: req.file.filename,
    Body: buffer,
    ContentType: 'image/jpeg',
  };
  await s3Client.send(new PutObjectCommand(input));
  req.file.filename = process.env.AWS_S3_BUCKET_URL + req.file.filename;
  next();
});

const uploadCourseVideosFile = catchAsync(async (sectionLecture, options) => {
  console.log(options);
  // if (!options.videos) return;
  // let totalDuration = 0;
  // let videoPreviewUrl = '';

  // const url = process.env.AWS_S3_BUCKET_URL;

  // const promiseSectionLecture = sectionLecture.map(async (section, idx) => {
  //   const filename = `courses/${options.courseId}/section_${sectionLecture.sectionId}/lecture-${sectionLecture.lectureId}.mp4`;

  //   // sectionLecture.sectionId
  //   const input = {
  //     Bucket: process.env.AWS_S3_BUCKET_URL,
  //     Key: filename,
  //     Body: options.videos[idx].buffer,
  //     ContentType: 'video/mp4',
  //   };

  //   // First Video as Preview
  //   if (idx === 0) videoPreviewUrl = url + filename;

  //   // Write buffer to temp file
  //   // Path to the temporary directory
  //   const tempDir = path.join('temp');

  //   // Create the directory if it doesn't exist
  //   if (!fs.existsSync(tempDir)) {
  //     fs.mkdirSync(tempDir);
  //   }
  //   const tempFilePath = path.join(
  //     'temp',
  //     `${options.videos[idx].originalname}`,
  //   );
  //   let videoDuration;
  //   fs.mkdir(tempDir, { recursive: true }, (err) => {
  //     if (err) return new AppError('Error creating directory', 500);

  //     // Write the file asynchronously
  //     fs.writeFile(tempFilePath, options.videos[idx].buffer, () => {
  //       // Get the video duration after writing the file
  //       getVideoDurationInSeconds(tempFilePath)
  //         .then((duration) => {
  //           videoDuration = duration;
  //           totalDuration += videoDuration;
  //           // Optional: Clean up the temporary file if needed
  //           fs.unlink(tempFilePath, () => {
  //             if (err) throw err;
  //           });
  //         })
  //         .catch(() => {
  //           throw err;
  //         });
  //     });
  //   });
  //   // sectionLecture.videoUrl = url + filename;
  //   // sectionLecture.duration = videoDuration;

  //   // const lecture = await Lecture.findByPk(section.lectureId);
  //   // if (lecture) {
  //   //   lecture.videoUrl = url + filename;
  //   //   lecture.duration = videoDuration;
  //   //   await lecture.save();
  //   // }

  //   // await s3Client.send(new PutObjectCommand(input));
  //   console.log('section_lection: ', sectionLecture);
  // });
  // await Promise.all(promiseSectionLecture);

  // const filename = `courses/${sectionLecture[0].courseId}/thumbnail.jpeg`;

  // if (options.thumbnails) {
  //   const buffer = await sharp(options.thumbnails[0].buffer)
  //     .resize(500, 500)
  //     .toFormat('jpeg')
  //     .jpeg({ quality: 90 })
  //     .toBuffer();
  //   const input = {
  //     Bucket: process.env.AWS_S3_ASSET_BUCKET,
  //     Key: filename,
  //     Body: buffer,
  //     ContentType: 'image/jpeg',
  //   };
  //   await s3Client.send(new PutObjectCommand(input));
  // }

  // const course = await Course.findByPk(sectionLecture[0].courseId);
  // if (course) {
  //   course.duration = totalDuration;
  //   course.thumbnailUrl = url + filename;
  //   await course.save();
  // }
});
module.exports = {
  resizeUploadProfileImage,
  uploadCourseVideosFile,
};
