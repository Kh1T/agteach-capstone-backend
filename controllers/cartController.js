const catchAsync = require('../utils/catchAsync');

exports.getCartItems = catchAsync(async (req, res, next) => {
  res.json({ status: 'success' });
});
