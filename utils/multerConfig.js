const multer = require('multer');
const AppError = require('./appError');

const multerStorage = multer.memoryStorage();
/**
 * Filters incoming files to allow only images.
 *
 * @param {object} req - The Express request object.
 * @param {object} file - The file object containing information about the uploaded file.
 * @param {function} cb - A callback function to indicate success or failure.
 * @returns {void} Calls the callback with `null` and `true` if the file is an image, otherwise calls with an error.
 */
const imageFilter = (req, file, cb) => {
  if (!req.file && file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};



/**
 * Middleware for uploading product images with multer.
 *
 * Configures multer to use memory storage, filters files to allow only images,
 * and sets up fields for a single product cover image and up to four additional product images.
 *
 * @const {Multer} uploadProductImages
 */
const uploadProductImages = multer({
  storage: multerStorage,
  fileFilter: imageFilter,
}).fields([
  { name: 'productCover', maxCount: 1 },
  { name: 'productImages', maxCount: 4 },
]);


/**
 * Middleware for uploading a user profile image with multer.
 *
 * Configures multer to use memory storage, filters files to allow only images,
 * and sets a single file field named `photo`.
 *
 * @const {Multer} uploadProfileImage
 */
const uploadProfileImage = multer({
  storage: multerStorage,
  fileFilter: imageFilter,
});

/**
 * Filters incoming files to allow only videos or images.
 *
 * @param {object} req - The Express request object.
 * @param {object} file - The file object containing information about the uploaded file.
 * @param {function} cb - A callback function to indicate success or failure.
 * @returns {void} Calls the callback with `null` and `true` if the file is a video or image, otherwise calls with an error.
 */
const videoFilter = (req, file, cb) => {
  if (
    (!req.file && file.mimetype.startsWith('video')) ||
    file.mimetype.startsWith('image')
  ) {
    cb(null, true);
  } else {
    cb(new AppError('Not a video! Please upload only videos.', 400), false);
  }
};

/**
 * Middleware for uploading course videos with multer.
 * 
 * Configures multer to use memory storage, filters files to allow only videos,
 * and sets a file size limit of 200MB.
 *
 * @const {Multer} uploadCourseVideosMulter
 */
const uploadCourseVideosMulter = multer({
  storage: multerStorage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB limit
  },
});

module.exports = {
  uploadProfileImage,
  uploadProductImages,
  uploadCourseVideosMulter,
};
