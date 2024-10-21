const sharp = require('sharp');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const catchAsync = require('./catchAsync');
const s3Client = require('../config/s3Connection');
const AppError = require('./appError');
const Course = require('../models/courseModel');

const uploadToS3 = catchAsync(async (filename, body) => {
  if (!body) return new AppError('There is no body to upload to', 400);
  const input = {
    Bucket: process.env.AWS_S3_ASSET_BUCKET,
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
    const url = process.env.AWS_S3_BUCKET_URL;
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
      Bucket: process.env.AWS_S3_ASSET_BUCKET,
      Key: filename,
      Body: buffer,
      ContentType: 'image/jpeg',
    };

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_ASSET_BUCKET,
        Key: filename,
      }),
    );

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
  console.log('mapping:', createIndexMappings(currentLectures));
  const url = process.env.AWS_S3_BUCKET_URL;
  console.log('currentLecture', currentLectures);

  const lecturePromises = currentLectures.map(async (lecture, idx) => {
    console.log('options', options.newLectures);
    const { sectionId } = lecture.dataValues;
    let sectionIdx = sectionIndexMapping[sectionId];
    const lectureIdx = lectureIndexMapping[sectionId];

    // if videos[234][0]
    // it mean new old section and new lecture 0
    // true mean it is new section
    // false mean it is old section
    // if (!options.newLectures[idx].isNewUpdateSection) {
    //   const videoFile = options.files.find(
    //     (file) =>
    //       file.fieldname ===
    //       `videos[${options.newLectures[idx].sectionId}][${lectureIdx}]`,
    //   );
    // }

    if (options.isUpdated) {
      sectionIdx = sectionId;
      console.log('optionsIsupdate');
    } else {
      sectionIdx = options.videoIndex;
    }

    // if(options.newLecture[idx].updatedSection){
    //   sectionIdx = options.updateSection;
    // }
    console.log(
      `Lecture ID: ${lecture.dataValues.lectureId}, Section ID: ${sectionId}, Section Index: ${sectionIdx}, Lecture Index: ${lectureIdx}`,
    );
    const videoFile = options.files.find(
      (file) => file.fieldname === `videos[${sectionIdx}][${lectureIdx}]`,
    );

    console.log('videoFile', videoFile);
    const filename = `courses/${options.courseId}/section-${lecture.sectionId}/lecture-${lecture.lectureId}.mp4`;

    console.log('file:', filename);
    // Updated preview Video
    if (!options.isUpdated && sectionIdx === 0 && lectureIdx === 0) {
      const { newCourse } = options;
      console.log('currentCourse', newCourse);

      newCourse.previewVideoUrl = url + filename;
      // course.update({ previewVideoUrl: filename });
      newCourse.save();
    }

    if (videoFile) {
      uploadToS3(filename, videoFile.buffer);
    }
    lectureIndexMapping[sectionId] += 1;

    lecture.videoUrl = url + filename;
    await lecture.update({ videoUrl: url + filename }, { ...options });
  });
  await Promise.all(lecturePromises);
});

module.exports = {
  resizeUploadProfileImage,
  resizeUplaodCourseThumbail,
  uploadCourseVideos,
  uploadToS3,
};

// [
//   {
//       "sectionId": 1284,
//       "instructorId": 71,
//       "courseId": 785,
//       "name": "updated section",
//       "lectures": [
//           {
//               "lectureId": 1866,
//               "instructorId": 71,
//               "sectionId": 1284,
//               "name": "Lecuter 1 updated",
//               "videoUrl": "https://agteach-dev-assets.s3.ap-southeast-2.amazonaws.com/courses/785/section-1284/lecture-1866.mp4",
//           },
//           {
//               "lectureId": 1867,
//               "instructorId": 71,
//               "sectionId": 1284,
//               "name": "lecture 2",
//               "videoUrl": "https://agteach-dev-assets.s3.ap-southeast-2.amazonaws.com/courses/785/section-1284/lecture-1867.mp4",
//           }
//       ]
//   },
//   {
//       "sectionId": 1285,
//       "instructorId": 71,
//       "courseId": 785,
//       "name": "section 2",
//       "lectures": [
//           {
//               "lectureId": 1868,
//               "instructorId": 71,
//               "sectionId": 1285,
//               "name": "lecture 1",
//               "videoUrl": "https://agteach-dev-assets.s3.ap-southeast-2.amazonaws.com/courses/785/section-1285/lecture-1868.mp4",
//           },
//           {
//               "lectureId": 1869,
//               "instructorId": 71,
//               "sectionId": 1285,
//               "name": "lecture 2",
//               "videoUrl": "https://agteach-dev-assets.s3.ap-southeast-2.amazonaws.com/courses/785/section-1285/lecture-1869.mp4",
//           },
//           {
//               "lectureId": 1870,
//               "instructorId": null,
//               "sectionId": 1285,
//               "name": "3",
//               "videoUrl": "https://agteach-dev-assets.s3.ap-southeast-2.amazonaws.com/courses/785/section-1285/lecture-1870.mp4",
//           }
//       ]
//   },
//   {
//       "sectionId": 1286,
//       "instructorId": 71,
//       "courseId": 785,
//       "name": "section 3",
//       "lectures": [
//           {
//               "lectureId": 1871,
//               "instructorId": null,
//               "sectionId": 1286,
//               "name": "lecture 1",
//               "videoUrl": "https://agteach-dev-assets.s3.ap-southeast-2.amazonaws.com/courses/785/section-1286/lecture-1871.mp4",
//           },
//           {
//               "lectureId": 1872,
//               "instructorId": null,
//               "sectionId": 1286,
//               "name": "lecture 2",
//               "videoUrl": "https://agteach-dev-assets.s3.ap-southeast-2.amazonaws.com/courses/785/section-1286/lecture-1872.mp4",
//           },
//           {
//               "lectureId": 1873,
//               "instructorId": null,
//               "sectionId": 1286,
//               "name": "lecture 3",
//               "videoUrl": "https://agteach-dev-assets.s3.ap-southeast-2.amazonaws.com/courses/785/section-1286/lecture-1873.mp4",
//           }
//       ]
//   },
//   {
//       "sectionId": 1287,
//       "instructorId": 71,
//       "courseId": 785,
//       "name": "section 4",
//       "lectures": [
//           {
//               "lectureId": 1874,
//               "instructorId": null,
//               "sectionId": 1287,
//               "name": "lecture 1",
//               "videoUrl": "https://agteach-dev-assets.s3.ap-southeast-2.amazonaws.com/courses/785/section-1287/lecture-1874.mp4",
//           }
//       ]
//   }
// ]
