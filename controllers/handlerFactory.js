const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const UserAccount = require('../models/userModel');
const Customer = require('../models/customerModel');

UserAccount.hasOne(Customer, { foreignKey: 'userUid' });
Customer.belongsTo(UserAccount);
// Factory function for getting one document by primary key
exports.getOne = (Model, options = {}) =>
  catchAsync(async (req, res, next) => {
    // Fetch the document by primary key (UID) with optional inclusion
    const data = await Model.findByPk(
      req.params.userUid || req.user.userUid || req.params.id,
      {
        ...options,
      },
    );

    if (!data) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data,
    });
  });
