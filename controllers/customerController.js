const Customer = require('../models/customerModel');
const factory = require('./handlerFactory');
const UserAccount = require('../models/userModel');
const Location = require('../models/locationModel');
const { uploadProfileImage } = require('../utils/multerConfig');
const { resizeUploadProfileImage } = require('../utils/uploadMiddleware');

exports.addAdditionalInfo = factory.additionalInfo(Customer);

exports.fetchCustomer = factory.fetchMemberData(Customer, ['customerId']);

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
        'dateOfBirth',
        'imageUrl',
      ],
      include: {
        model: Location,
        attributes: ['locationId', 'name'],
      },
    },
  ],
});

exports.uploadProfile = uploadProfileImage.single('photo');
exports.resizeProfile = resizeUploadProfileImage;
exports.updateMe = factory.updateMe(Customer);
