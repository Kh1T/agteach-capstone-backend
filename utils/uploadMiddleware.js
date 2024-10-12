const sharp = require('sharp');
const { PutObjectCommand } = require('@aws-sdk/client-s3');

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

const uploadCourseVidoes = catchAsync(async (currentLectures, options) => {
  if (!options.files) return;

  // options{ courseId, files: videos[], thumnail[] }
  const url = process.env.AWS_S3_BUCKET_URL;

  // There are many lecutre when create bulk
  const lecturePromises = currentLectures.map(async (lecture, idx) => {
    const filename = `courses/${options.courseId}/section_${currentLectures.sectionId}/lecture-${currentLectures.lectureId}.mp4`;

  });
  await Promise.all(lecturePromises);
});

const uploadCourseVideosFile = catchAsync(async (sectionLecture, options) => {
  console.log(options);
  if (!options.files) return;

  // options{ courseId, files: videos[], thumnail[] }
  const { files } = options;
  // let videoPreviewUrl = '';

  const url = process.env.AWS_S3_BUCKET_URL;

  const promiseSectionLecture = sectionLecture.map(async (section, idx) => {
    // filename to put into the bucket
    const filename = `courses/${options.courseId}/section_${sectionLecture.sectionId}/lecture-${sectionLecture.lectureId}.mp4`;

    // Upload to AWS
    const input = {
      Bucket: process.env.AWS_S3_BUCKET_URL,
      Key: filename,
      Body: files.videos[idx].buffer,
      ContentType: 'video/mp4',
    };

    // First Video as Preview
    // if (idx === 0) videoPreviewUrl = url + filename;

    // const lecture = await Lecture.findByPk(section.lectureId);
    // if (lecture) {
    //   lecture.videoUrl = url + filename;
    //   lecture.duration = videoDuration;
    //   await lecture.save();
    // }

    // await s3Client.send(new PutObjectCommand(input));
    console.log('section_lection: ', sectionLecture);
  });
  await Promise.all(promiseSectionLecture);

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
  resizeUplaodCourseThumbail,
  uploadCourseVidoes,
};
