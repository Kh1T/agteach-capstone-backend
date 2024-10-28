const User = require('../models/userModel');
const factory = require('./handlerFactory');
const Location = require('../models/locationModel');

// Request userUid
// Then pass it to the next middleware
exports.getMe = (req, res, next) => {
  req.params.userUid = req.user.userUid;
  next();
};

exports.updateMe = factory.updateMe(User);
exports.getUser = factory.getOne(User);
exports.getLocation = factory.getAll(Location);
