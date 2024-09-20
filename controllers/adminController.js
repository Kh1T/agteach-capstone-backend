const UserAccount = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');

exports.getAdminInfo = catchAsync(async (req, res, next) => {
  const { role } = req.user;
  if (role !== 'admin') {
    return res.status(403).json({
      status: 'fail',
      message:
        'Access denied. You are not authorized to view this information.',
    });
  }

  const admin = await UserAccount.findOne({
    where: {
      userUid: req.user.userUid,
      role: 'admin',
    },
  });

  if (!admin) {
    return res.status(404).json({
      status: 'fail',
      message: 'Admin not found.',
    });
  }

  res.status(200).json({
    status: 'success',
    data: admin,
  });
});
