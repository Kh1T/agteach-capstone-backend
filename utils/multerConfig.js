const multer = require('multer');
const AppError = require('./appError');

const multerFilter = (req, file, cb) => {
  if (file.memetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: multerFilter,
})

module.exports = upload