const sharp = require('sharp');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const { getVideoDurationInSeconds } = require('get-video-duration');
const fs = require('fs');

const catchAsync = require('./catchAsync');
const s3Client = require('../config/s3Connection');
const Lecture = require('../models/lectureModel');
const AppError = require('./appError');

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
  if (!options) return; 
  const url = process.env.AWS_S3_BUCKET_URL;

  const promiseSectionLecture = sectionLecture.map(async (section, idx) => {
    const filename = `courses/${section.courseId}/section_${section.sectionId}/lecture-${section.lectureId}.mp4`;
    const input = {
      Bucket: process.env.AWS_S3_BUCKET_URL,
      Key: filename,
      Body: options.videos[idx].buffer,
      ContentType: 'video/mp4',
    };
    // Write buffer to temp file
    // Path to the temporary directory
    const tempDir = path.join('temp');

    // Create the directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    const tempFilePath = path.join(
      'temp',
      `${options.videos[idx].originalname}`,
    );
    let videoDuration;
    fs.mkdir(tempDir, { recursive: true }, (err) => {
      if (err) return new AppError('Error creating directory', 500);

      // Write the file asynchronously
      fs.writeFile(tempFilePath, options.videos[idx].buffer, () => {
        // Get the video duration after writing the file
        getVideoDurationInSeconds(tempFilePath)
          .then((duration) => {
            videoDuration = duration;

            // Optional: Clean up the temporary file if needed
            fs.unlink(tempFilePath, () => {
              if (err) throw err;
            });
          })
          .catch(() => {
            throw err;
          });
      });
    });

    const lecture = await Lecture.findByPk(section.lectureId);
    if (lecture) {
      lecture.videoUrl = url + filename;
      lecture.duration = videoDuration;
      await lecture.save();
    }

    // await s3Client.send(new PutObjectCommand(input));
  });
  await Promise.all(promiseSectionLecture);
});
module.exports = {
  resizeUploadProfileImage,
  uploadCourseVideosFile,
};
