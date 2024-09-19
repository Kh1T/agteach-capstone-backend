const User = require('../models/userModel');
const factory = require('./handlerFactory');

exports.getMe = (req, res, next) => {
  req.params.userUid = req.user.userUid;
  next();
};

exports.updateMe = factory.updateMe(User);

exports.getUser = factory.getOne(User);
