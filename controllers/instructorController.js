const UserAccount = require('../models/userModel');
const Instructor = require('../models/instructorModel');
const factory = require('./handlerFactory');
const { uploadProfileImage } = require('../utils/multerConfig');
const { resizeUploadProfileImage } = require('../utils/uploadMiddleware');

exports.getAdditionalInfo = factory.getOne(UserAccount, {
  include: [
    {
      model: Instructor, // Include related UserAccount model
      attributes: [
        'email',
        'phone',
        'address',
        'firstName',
        'lastName',
        'location_id',
        'dateOfBirth',
        'imageUrl',
      ],
    },
  ],
});

exports.uploadIntructorPhoto = uploadProfileImage('photo');
exports.resizeUploadProfile = resizeUploadProfileImage();

exports.addAdditionalInfo = factory.additionalInfo(Instructor);
exports.updateMe = factory.additionalInfo(Instructor);

