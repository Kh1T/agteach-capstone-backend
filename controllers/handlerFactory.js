const { Op } = require('sequelize');
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
    let queryOption = {};
    const { page = 1, limit = 20 } = req.query;

    if (req.query.page) {
      const offset = (page - 1) * limit;

      queryOption = {
        offset: Number(offset),
        limit: Number(limit),
      };
    }

    const data = await Model.findAll(queryOption);

    res.status(200).json({
      status: 'success',
      results: data.length,
      page: Number(page),
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
    if (req.file) req.body.imageUrl = req.file.filename;
    const filteredBody = filterObj(
      req.body,
      'username',
      'email',
      'imageUrl',
      'firstName',
      'lastName',
      'address',
      'phone',
      'bio',
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

      const userData = await Model.update(
        {
          ...data,
        },
        {
          where: { userUid: req.user.userUid },
        },
      );

      await sendEmail(req.user, {
        templateId: process.env.SIGNUP_EMAIL_TEMPLATE_ID,
        subject: 'Your account has been created',
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
    const { name, order, page = 1, limit = 20, category } = req.query;

    // Initialize options object for the query
    let options = { where: {} };

    if (page) {
      const offset = (page - 1) * limit;

      options.offset = Number(offset);
      options.limit = Number(limit);
    }

    // Add search condition if "name" query exists
    if (name) {
      options.where.name = { [Op.iLike]: `%${name}%` };
    }

    if (category) {
      options.where.categoryId = category;
    }

    // Add sorting condition if "order" query exists
    if (order) {
      options.order = [['createdAt', order]];
    }

    // Fetch data from the Model based on options
    const data = await Model.findAll(options);

    const totalCount = await Model.count({
      where: options.where,
    });

    res.status(200).json({
      status: 'success',
      results: totalCount,
      page: Number(page),
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

    console.log(req.url);

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

exports.getUserItems = (Model1, Model2, category) =>
  catchAsync(async (req, res, next) => {
    // Model 1 : Model For Finding Data
    // Model 2 : Model embedded ID  For Finding Model 1
    const { name, order } = req.query;

    const queryOption = {
      where: { name: { [Op.iLike]: `%${name}%` } },
      order: [['createdAt', order || 'DESC']],
      include: [
        {
          model: Model2,
          where: {
            userUid: req.user.userUid,
          },
        },
      ],
    };

    if (category) {
      queryOption.include.push(category);
    }

    const item = await Model1.findAll(queryOption);

    if (!item)
      return next(new AppError("This User doesn't have any items", 404));

    res.status(200).json({
      status: 'success',
      item,
    });
  });

exports.fetchMemberData = (Model, field) =>
  catchAsync(async (req, res, next) => {
    const memberData = await Model.findOne({
      where: { userUid: req.user.userUid },
      attributes: [...field],
    });

    if (!memberData) {
      return next(new AppError('Member not found', 404));
    }

    req.memberData = memberData;
    next();
  });
