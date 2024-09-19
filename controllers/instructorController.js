const UserAccount = require('../models/userModel');
const Instructor = require('../models/instructorModel');
const Location = require('../models/locationModel');
const factory = require('./handlerFactory');

exports.getAdditionalInfo = factory.getOne(UserAccount, {
  include: [
    {
      model: Instructor,
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

exports.addAdditionalInfo = factory.additionalInfo(Instructor);
exports.updateMe = factory.updateMe(Instructor);

exports.getLocation = factory.getAll(Location);
