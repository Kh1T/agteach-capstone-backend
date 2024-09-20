const Customer = require('../models/customerModel');
const factory = require('./handlerFactory');
const UserAccount = require('../models/userModel');

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

exports.updateMe = factory.updateMe(Customer);
