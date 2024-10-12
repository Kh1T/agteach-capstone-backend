const sharp = require('sharp');
const { PutObjectCommand } = require('@aws-sdk/client-s3');

const catchAsync = require('./catchAsync');
const s3Client = require('../config/s3Connection');

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

// Upload Thumnail Course
// This function will use in the after create course to get courseId
const resizeUplaodCourseThumbail = catchAsync(
  async (currentCourse, options) => {
    // options{ courseId, files: videos[], thumnailUrl[] }
    const url = process.env.AWS_S3_BUCKET_URL;
    const filename = `courses/${currentCourse.courseId}/thumbnail.jpeg`;

    const buffer = await sharp(options.files.thumbnailUrl[0].buffer)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toBuffer();

    const input = {
      Bucket: process.env.AWS_S3_ASSET_BUCKET,
      Key: filename,
      Body: buffer,
      ContentType: 'image/jpeg',
    };
    await s3Client.send(new PutObjectCommand(input));
    currentCourse.thumbnailUrl = url + filename;
    await currentCourse.save();
  },
);

const uploadCourseVideos = catchAsync(async (currentLectures, options) => {
  // If using HLS video give true else give false;
  const isHlsVideo = true;
  if (!options.files) return;

  // options{ courseId, files: videos[], thumnail[] }
  let url;
  let bucket;
  if (isHlsVideo) {
    url = process.env.AWS_S3_BUCKET_TRANSCODE_URL;
    bucket = process.env.AWS_S3_ASSET_COURSE_BUCKET;
  } else {
    url = process.env.AWS_S3_BUCKET_URL;
    bucket = process.env.AWS_S3_ASSET_BUCKET
  }

  // There are many lecutre when create bulk
  const lecturePromises = currentLectures.map(async (lecture, idx) => {
    const filename = `courses/${options.courseId}/section-${lecture.sectionId}/lecture-${lecture.lectureId}.mp4`;

    // Upload to AWS
    const input = {
      Bucket: bucket,
      Key: filename,
      Body: options.files.videos[idx].buffer,
    };
    // await s3Client.send(new PutObjectCommand(input));

    if (isHlsVideo) {
      // Split to get filename without extension
      lecture.videoUrl = `${url}${filename.split('.')[0]}/master.m3u8`;
    } else {
      lecture.videoUrl = url + filename;
    }

    console.log(lecture);
    await lecture.save();
  });
  await Promise.all(lecturePromises);
});

module.exports = {
  resizeUploadProfileImage,
  resizeUplaodCourseThumbail,
  uploadCourseVideos,
};
