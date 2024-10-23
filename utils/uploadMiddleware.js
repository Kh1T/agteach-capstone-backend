const sharp = require('sharp');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const catchAsync = require('./catchAsync');
const s3Client = require('../config/s3Connection');
const AppError = require('./appError');

const uploadVideoToS3 = catchAsync(async (filename, body) => {
  if (!body) return new AppError('There is no body to upload to', 400);
  const input = {
    Bucket: process.env.AWS_S3_ASSET_COURSE_BUCKET,
    Key: filename,
    Body: body,
  };
  await s3Client.send(new PutObjectCommand(input));
});
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

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_ASSET_BUCKET,
      Key: req.file.filename,
    }),
  );

  await s3Client.send(new PutObjectCommand(input));
  req.file.filename = process.env.AWS_S3_BUCKET_URL + req.file.filename;
  next();
});

// Upload Thumnail Course
// This function will use in the after create course to get courseId
const resizeUplaodCourseThumbail = catchAsync(
  async (currentCourse, options) => {
    const url = process.env.AWS_S3_COURSE_BUCKET_URL;
    const filename = `courses/${currentCourse.courseId}/thumbnail.jpeg`;
    const thumbnailFile = options.files.find(
      (file) => file.fieldname === `thumbnailUrl`,
    );
    if (!thumbnailFile) return;
    const buffer = await sharp(thumbnailFile.buffer)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toBuffer();

    const input = {
      Bucket: process.env.AWS_S3_ASSET_COURSE_BUCKET,
      Key: filename,
      Body: buffer,
      ContentType: 'image/jpeg',
    };

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_ASSET_COURSE_BUCKET,
        Key: filename,
      }),
    );

    await s3Client.send(new PutObjectCommand(input));
    currentCourse.thumbnailUrl = url + filename;
    await currentCourse.save();
  },
);

const uploadCourseVideos = async (currentLectures, options) => {
  if (!options.files) return;

  // Create section and lecture index mappings
  const url = process.env.AWS_S3_COURSE_BUCKET_URL;

  const lecturePromises = currentLectures.map(async (lecture, idx) => {
    let sectionIdx;
    let lectureIdx;

    if (options.isUpdated) {
      sectionIdx = options.newLectures[idx].updatedSections[0];
      lectureIdx = options.newLectures[idx].updatedSections[1];
    } else {
      sectionIdx = options.videoIndex;
      lectureIdx = idx;
    }

    const videoFile = options.files.find(
      (file) => file.fieldname === `videos[${sectionIdx}][${lectureIdx}]`,
    );

    const filename = `courses/${options.courseId}/section-${lecture.sectionId}/lecture-${lecture.lectureId}.mp4`;

    // Updated preview Video
    if (!options.isUpdated && sectionIdx === 0 && lectureIdx === 0) {
      const { newCourse } = options;

      newCourse.previewVideoUrl = url + filename;
      newCourse.save();
    }

    if (videoFile) {
      uploadVideoToS3(filename, videoFile.buffer);
    }

    lecture.videoUrl = url + filename;
    await lecture.update({ videoUrl: url + filename }, { ...options });
  });
  await Promise.all(lecturePromises);
};

module.exports = {
  resizeUploadProfileImage,
  resizeUplaodCourseThumbail,
  uploadCourseVideos,
  uploadVideoToS3,
};
