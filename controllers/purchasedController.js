const catchAsync = require('../utils/catchAsync');

exports.getCheckoutSession = catchAsync(async (res, req, next) => {
  res.json({
    statu: 200,
    message: 'This route is working',
  });
});
