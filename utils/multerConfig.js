const multer = require('multer');
const AppError = require('./appError');

const multerStorage = multer.memoryStorage();
const imageFilter = (req, file, cb) => {
  if (!req.file && file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

// using req.files.productCover[0].buffer to get the buffer
// This one was send to Resize Upload
const uploadProductImages = multer({
  storage: multerStorage,
  fileFilter: imageFilter,
}).fields([
  { name: 'productCover', maxCount: 1 },
  { name: 'productImages', maxCount: 4 },
]);

// This one was send to Resize Upload
const uploadProfileImage = multer({
  storage: multerStorage,
  fileFilter: imageFilter,
});

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
