const Customer = require('../models/customerModel');

exports.additionalInfo = async (req, res, next) => {
  const { email, userUid } = req.user;
  // console.log(email, password)
  const data = req.body;
  data.userUid = userUid;
  data.email = email;
  const customers = await Customer.create(data);

  res.json({
    status: 'success',
    data: customers,
    isAuthenticated: !!req.isAuthenticated,
  });
};
