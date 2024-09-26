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

module.exports = { uploadProfileImage, uploadProductImages };
