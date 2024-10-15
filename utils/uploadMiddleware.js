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
  return url + filename;
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

const uploadCourseVideos = catchAsync(async (currentLectures, options) => {
  // If using HLS video give true else give false;
  const isHlsVideo = false;
  if (!options.files) return;

  // if (options.isUpdated){
  //   const groupedLectures = currentLectures.reduce((accumulator, lecture) => {
  //     const sectionId = lecture.dataValues.sectionId;

  //     // Initialize the section array if it doesn't exist
  //     if (!accumulator[sectionId]) {
  //       accumulator[sectionId] = [];
  //     }

  //     // Push the lecture into the corresponding section array
  //     accumulator[sectionId].push(lecture);

  //     return accumulator;
  //   }, {});

  //   // Example output
  //   console.log(groupedLectures);

  // // Assuming groupedLectures is already defined as per the previous example
  // Object.entries(groupedLectures).forEach(([sectionId, lectures],sectionIndex) => {
  //   console.log(`Section ID: ${sectionId}`);

  //   lectures.forEach((lecture, index) => {
  //     console.log(`  Video: [${sectionIndex}][${index}]`);
  //   });
  // });
  // }
  // else{

  // }
  // Create section and lecture index mappings
  const createIndexMappings = (lectures) => {
    const sectionIndexMapping = {};
    const lectureIndexMapping = {};
    let sectionIndex = 0;

    lectures.forEach((lecture) => {
      const sectionId = lecture.dataValues.sectionId;

      if (!(sectionId in sectionIndexMapping)) {
        sectionIndexMapping[sectionId] = sectionIndex;
        sectionIndex++;
      }

      if (!lectureIndexMapping[sectionId]) {
        lectureIndexMapping[sectionId] = 0;
      }
    });

    return { sectionIndexMapping, lectureIndexMapping };
  };
  const { sectionIndexMapping, lectureIndexMapping } =
    createIndexMappings(currentLectures);

  // const sectionIndexMapping = {};
  // let currentIndex = 0;
  // // Loop through the currentLectures to create the sectionIndexMapping
  // currentLectures.forEach((lecture) => {
  //   const sectionId = lecture.dataValues.sectionId;

  //   // If sectionId is not in the mapping, assign it the current index
  //   if (!(sectionId in sectionIndexMapping)) {
  //     sectionIndexMapping[sectionId] = currentIndex;
  //     currentIndex++; // Increment the index for the next section
  //   }
  // });

  // options{ courseId, files: videos[], thumnail[] }
  let url;
  let bucket;
  if (isHlsVideo) {
    url = process.env.AWS_S3_BUCKET_TRANSCODE_URL;
    bucket = process.env.AWS_S3_ASSET_COURSE_BUCKET;
  } else {
    url = process.env.AWS_S3_BUCKET_URL;
    bucket = process.env.AWS_S3_ASSET_BUCKET;
  }

  // There are many lecutre when create bulk
  console.log('currentlecture', currentLectures);
  // const lecturePromises2 = currentLectures.map(async (lecture) => {
  //   const sectionId = lecture.dataValues.sectionId;
  //   const sectionIdx = sectionIndexMapping[sectionId];
  //   const lectureIdx = lectureIndexMapping[sectionId];

  //   lectureIndexMapping[sectionId] += 1; // Increment lecture index for next lecture in the same section

  //   await uploadLectureVideo(lecture, sectionIdx, lectureIdx, options, isHlsVideo, url, bucket);
  // })

  const lecturePromises = currentLectures.map(async (lecture, idx) => {
    // idx += options.videoIndex;
    // const sectionId = lecture.dataValues.sectionId;
    // const assignedIndex = sectionIndexMapping[sectionId];
    // const sectionId = lecture.dataValues.sectionId;
    const sectionId = lecture.dataValues.sectionId;
    let sectionIdx = sectionIndexMapping[sectionId];
    const lectureIdx = lectureIndexMapping[sectionId];

    console.log(
      `Lecture ID: ${lecture.dataValues.lectureId}, Section ID: ${sectionId}, Section Index: ${sectionIdx}, Lecture Index: ${lectureIdx}`,
    );

    // let videoIndex = 0;
    // let fieldName = '';
    // console.log('options:', options);
    if (!options.isUpdated) {
      sectionIdx = options.videoIndex;
    }

    const videoFile = options.files.find(
      (file) => file.fieldname === `videos[${sectionIdx}][${lectureIdx}]`,
    );
    const filename = `courses/${options.courseId}/section-${lecture.sectionId}/lecture-${lecture.lectureId}.mp4`;
    // console.log('lecuture_name: ', lecture.name, 'video idx:', idx);
    // console.log('video_file_name: ', options.files.videos[idx].originalname);
    // Upload to AWS
    // const input = {
    //   Bucket: bucket,
    //   Key: filename,
    //   Body: options.files.videos[idx].buffer,
    // };
    // await s3Client.send(new PutObjectCommand(input));

    // uploadToS3(filename, options.files.videos[idx].buffer);
    console.log('index', options.videoIndex);
    console.log('videoFile:', videoFile);
    uploadToS3(filename, videoFile?.buffer);
    lectureIndexMapping[sectionId] += 1;
    if (isHlsVideo) {
      // Split to get filename without extension
      lecture.videoUrl = `${url}${filename.split('.')[0]}/master.m3u8`;
    } else {
      lecture.videoUrl = url + filename;
    }
    // options.videoIndex += 1;
    await lecture.save();
  });
  await Promise.all(lecturePromises);
});

module.exports = {
  resizeUploadProfileImage,
  resizeUplaodCourseThumbail,
  uploadCourseVideos,
};
