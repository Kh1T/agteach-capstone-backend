const { Op, or } = require('sequelize');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/sendEmail');

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
    // Fetch the document by primary key (UID) with optional inclusion
    const data = await Model.findByPk(req.params.id || req.user.userUid, {
      ...options,
    });

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
    // console.log(req.body);
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

exports.additionalInfo = (Model) =>
  catchAsync(async (req, res, next) => {
    try {
      const data = req.body;
      data.userUid = req.user.userUid;
      data.email = req.user.email;
      const userData = await Model.create(data);

      await sendEmail(this, {
        templateId: process.env.SIGNUP_EMAIL_TEMPLATE_ID,
        subject: 'Your account has been created',
        text: `Your verification code is ${req.user.verificationCode}. Please enter this code on the verification page to complete your registration.`,
      });

      res.json({
        status: 'success',
        userData,
      });
    } catch (error) {
      next(error);
    }
  });

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const data = await Model.findByPk(req.params.id);
    await data.destroy();
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.sortData = (Model) =>
  catchAsync(async (req, res, next) => {
    const sortOrder = req.query.order || 'ASC';
    const data = await Model.findAll({
      order: [['createdAt', sortOrder]],
    });

    res.status(200).json({
      status: 'success',
      results: data.length,
      data,
    });
  });

exports.SearchData = (Model) =>
  catchAsync(async (req, res, next) => {
    const { name, order } = req.query;

    // Initialize options object for the query
    let options = {};

    // Add search condition if "name" query exists
    if (name) {
      options.where = { name: { [Op.iLike]: `%${name}%` } };
    }

    // Add sorting condition if "order" query exists
    if (order) {
      options.order = [['createdAt', order]];
    }

    // Fetch data from the Model based on options
    const data = await Model.findAll(options);
    console.log(options);
    res.status(200).json({
      status: 'success',
      results: data.length,
      data,
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const data = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data,
    });
  });

exports.recommendItems = (Model, idField, categoryField, attributes) =>
  catchAsync(async (req, res, next) => {
    const itemId = req.params.id;

    // Find the item (e.g., product or course) by its ID
    const item = await Model.findOne({
      where: { [idField]: itemId },
    });

    if (!item) {
      return next(new AppError('No item found with that ID', 404));
    }

    // Find recommended items in the same category
    const recommendItems = await Model.findAll({
      where: {
        [categoryField]: item[categoryField],
        [idField]: { [Op.ne]: itemId },
      },
      attributes: attributes, // Fields to return
    });

    // Send the response with recommended items
    res.status(200).json({
      status: 'success',
      data: recommendItems,
    });
  });

exports.getUserItems = (Model1, Model2) =>
  catchAsync(async (req, res, next) => {
    // Model 1 : Model For Finding Data
    // Model 2 : Model embedded ID  For Finding Model 1
    const { name, order } = req.query;

    const item = await Model1.findAll({
      where: { name: { [Op.iLike]: `%${name}%` } },
      order: [['createdAt', order || 'DESC']],
      include: {
        model: Model2,
        where: {
          userUid: req.user.userUid,
        },
      },
    });

    if (!item)
      return next(new AppError("This User doesn't have any items", 404));

    res.status(200).json({
      status: 'success',
      item,
    });
  });
