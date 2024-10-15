const sharp = require('sharp');
const { PutObjectCommand } = require('@aws-sdk/client-s3');

const catchAsync = require('./catchAsync');
const s3Client = require('../config/s3Connection');
const AppError = require('./appError');

const uploadToS3 = catchAsync(async (filename, body) => {
  if (!body) return new AppError('There is no body to upload to', 400);
  const url = process.env.AWS_S3_BUCKET_URL;
  const input = {
    Bucket: process.env.AWS_S3_ASSET_BUCKET,
    Key: filename,
    Body: body,
  };
  // await s3Client.send(new PutObjectCommand(input));
  // console.log(response)
  // return response
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
    // const thumbnailFile = options.files.thumbnailUrl[0]
    const thumbnailFile = options.files.find(
      (file) => file.fieldname === `thumbnailUrl`,
    );

    const buffer = await sharp(thumbnailFile.buffer)
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
const createIndexMappings = (lectures) => {
  const sectionIndexMapping = {};
  const lectureIndexMapping = {};
  let sectionIndex = 0;

  lectures.forEach((lecture) => {
    const { sectionId } = lecture.dataValues;

    if (!(sectionId in sectionIndexMapping)) {
      sectionIndexMapping[sectionId] = sectionIndex;
      sectionIndex += 1;
    }

    if (!lectureIndexMapping[sectionId]) {
      lectureIndexMapping[sectionId] = 0;
    }
  });

  return { sectionIndexMapping, lectureIndexMapping };
};

const uploadCourseVideos = catchAsync(async (currentLectures, options) => {
  // If using HLS video give true else give false;

  if (!options.files) return;

  // Create section and lecture index mappings
  const { sectionIndexMapping, lectureIndexMapping } =
    createIndexMappings(currentLectures);

  // options{ courseId, files: videos[], thumnail[] }
  const url = process.env.AWS_S3_BUCKET_URL;

  const lecturePromises = currentLectures.map(async (lecture) => {
    // idx += options.videoIndex;

    const { sectionId } = lecture.dataValues;
    let sectionIdx = sectionIndexMapping[sectionId];
    const lectureIdx = lectureIndexMapping[sectionId];

    console.log(
      `Lecture ID: ${lecture.dataValues.lectureId}, Section ID: ${sectionId}, Section Index: ${sectionIdx}, Lecture Index: ${lectureIdx}`,
    );
    if (!options.isUpdated) {
      sectionIdx = options.videoIndex;
    }
    const videoFile = options.files.find(
      (file) => file.fieldname === `videos[${sectionIdx}][${lectureIdx}]`,
    );
    console.log(videoFile)
    const filename = `courses/${options.courseId}/section-${lecture.sectionId}/lecture-${lecture.lectureId}.mp4`;

    // console.log('index', options.videoIndex);
    // console.log('videoFile:', videoFile);
    if (videoFile) {
      uploadToS3(filename, videoFile.buffer);
    }
    lectureIndexMapping[sectionId] += 1;
    lecture.videoUrl = url + filename;
    // options.videoIndex += 1;
    await lecture.save();
  });
  await Promise.all(lecturePromises);
});

module.exports = {
  resizeUploadProfileImage,
  resizeUplaodCourseThumbail,
  uploadCourseVideos,
  uploadToS3,
};
