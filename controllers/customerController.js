const Customer = require('../models/customerModel');
const factory = require('./handlerFactory');
const UserAccount = require('../models/userModel');

exports.additionalInfo = async (req, res, next) => {
  const data = req.body;
  data.userUid = req.user.userUid;
  data.email = req.user.email;
  const customers = await Customer.create(data);

  res.json({
    status: 'success',
    data: customers,
  });
};

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
