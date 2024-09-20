const Customer = require('../models/customerModel');
const factory = require('./handlerFactory');
const UserAccount = require('../models/userModel');
const { uploadProfileImage } = require('../utils/multerConfig');
const { resizeUploadProfileImage } = require('../utils/uploadMiddleware');

exports.addAdditionalInfo = factory.additionalInfo(Customer);

exports.getAdditionalInfo = factory.getOne(UserAccount, {
  include: [
    {
      model: Customer, // Include related UserAccount model
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

exports.uploadProfile = uploadProfileImage.single('photo');
exports.resizeProfile = resizeUploadProfileImage;
exports.updateMe = factory.updateMe(Customer);
