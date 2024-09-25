const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const UserAccount = require('../models/userModel');
const Customer = require('../models/customerModel');
const Instructor = require('../models/instructorModel');
const { Model } = require('sequelize');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// Factory function for getting one document by primary key
exports.getOne = (Model, options = {}) =>
  catchAsync(async (req, res, next) => {
    UserAccount.hasMany(Customer, { foreignKey: 'userUid' });
    UserAccount.hasMany(Instructor, { foreignKey: 'userUid' });
    Customer.belongsTo(UserAccount);
    Instructor.belongsTo(UserAccount);

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

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    const data = await Model.findAll();
    res.status(200).json({
      status: 'success',
      results: data.length,
      data,
    });
  });

exports.updateMe = (Model) =>
  catchAsync(async (req, res, next) => {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new AppError(
          'This route is not for password updates. Please use /updateMyPassword.',
          400,
        ),
      );
    }
    // // 2) Filtered out unwanted fields names that are not allowed to be updated
    req.body.imageUrl = req.file ? req.file.filename : null;
    const filteredBody = filterObj(
      req.body,
      'username',
      'email',
      'imageUrl',
      'firstName',
      'lastName',
      'phone',
      'dateOfBirth',
      'locationId',
    );

    // // 3) Update user document
    const updatedUser = await Model.update(filteredBody, {
      where: { userUid: req.user.userUid },
      returning: true,
      individualHooks: true, // to run validators
    });
    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser[1][0], // updatedUser[1] contains the updated records
      },
    });
  });

exports.additionalInfo = (Model) => async (req, res, next) => {
  const data = req.body;
  data.userUid = req.user.userUid;
  data.email = req.user.email;
  const userData = await Model.create(data);

  res.json({
    status: 'success',
    userData,
  });
};

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const data = await Model.findByPk(req.params.id);
    await data.destroy();
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
