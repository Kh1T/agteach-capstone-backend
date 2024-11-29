const sharp = require('sharp');
const {
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} = require('@aws-sdk/client-s3');

const catchAsync = require('./catchAsync');
const s3Client = require('../config/s3Connection');
const AppError = require('./appError');

/**
 * Uploads a video to S3.
 * @async
 * @param {string} filename - The S3 key for the video.
 * @param {Buffer} body - The video file buffer.
 * @throws {AppError} If the body is not provided.
 */
const uploadVideoToS3 = catchAsync(async (filename, body) => {
  if (!body) return new AppError('There is no body to upload', 400);
  const input = {
    Bucket: process.env.AWS_S3_ASSET_COURSE_BUCKET,
    Key: filename,
    Body: body,
  };
  await s3Client.send(new PutObjectCommand(input));
});


/**
 * @function resizeUploadProfileImage
 * @description Resize and upload user profile image to s3
 * @param {object} req - The Express request object
 * @param {object} res - The Express response object
 * @param {function} next - The Express next middleware function
 * @returns {Promise<void>}
 */
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
/**
 * @function resizeUplaodCourseThumbail
 * @description Upload thumbnail course and resize to 500x500
 * @param {object} currentCourse - The current course model
 * @param {object} options - The options object
 * @returns {Promise}
 */
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

    // Delete the old file
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_ASSET_COURSE_BUCKET,
        Key: filename,
      }),
    );

    // Upload the new file
    await s3Client.send(new PutObjectCommand(input));
    currentCourse.thumbnailUrl = url + filename;
    await currentCourse.save();
  },
);


/**
 * Uploads course videos to S3 and updates lecture video URLs.
 * 
 * @async
 * @param {Array} currentLectures - Array of lecture objects to be processed.
 * @param {Object} options - Options for processing the lectures.
 * @param {Object[]} options.files - Array of file objects containing video buffers.
 * @param {boolean} options.isUpdated - Flag indicating whether the lectures are updated.
 * @param {Object} options.newLectures - New lecture data containing updated sections.
 * @param {number} options.videoIndex - Index for video files in the upload sequence.
 * @param {Object} options.newCourse - Course object being processed.
 * @param {number} options.courseId - ID of the course for which videos are being uploaded.
 * 
 * @throws {Error} If any video upload fails.
 */
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

/**
 *
 *
 * @param {*} id product id or course id
 * @param {string} [type='products' | 'courses']
 * @return {*}
 */
const deleteFolderS3 = async (id, type = 'products') => {
  const listCommand = new ListObjectsV2Command({
    Bucket:
      type === 'course'
        ? process.env.AWS_S3_ASSET_COURSE_BUCKET
        : process.env.AWS_S3_ASSET_BUCKET, // the bucket
    Prefix: `${type}/${id}`, // the 'folder' courses/id products/id
  });
  const list = await s3Client.send(listCommand); // get the list

  if (list.KeyCount) {
    // if items to delete
    // delete the files
    const deleteCommand = new DeleteObjectsCommand({
      Bucket:
        type === 'course'
          ? process.env.AWS_S3_ASSET_COURSE_BUCKET
          : process.env.AWS_S3_ASSET_BUCKET,
      Delete: {
        Objects: list.Contents.map((item) => ({ Key: item.Key })), // array of keys to be deleted
        Quiet: false, // provides info on successful deletes
      },
    });
    const deleted = await s3Client.send(deleteCommand); // delete the files
    return `${deleted.Deleted.length} files deleted.`;
  }
};

module.exports = {
  resizeUploadProfileImage,
  resizeUplaodCourseThumbail,
  uploadCourseVideos,
  uploadVideoToS3,
  deleteFolderS3,
};
