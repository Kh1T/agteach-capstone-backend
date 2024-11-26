/**
 * @module documentController
 * @description This module provides controller functions for managing documents.
 */

const { Op } = require('sequelize');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/sendEmail');

/**
 * Filters an object to include only allowed fields.
 * @param {object} obj - The object to filter.
 * @param {...string} allowedFields - The allowed fields.
 * @returns {object} - The filtered object.
 */
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

/**
 * Factory function for getting one document by primary key.
 * @param {Sequelize.Model} Model - The Sequelize model.
 * @param {object} [options={}] - Additional options for the query.
 * @returns {function} - The controller function.
 */
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

/**
 * Factory function for getting all documents.
 * @param {Sequelize.Model} Model - The Sequelize model.
 * @returns {function} - The controller function.
 */
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

/**
 * Factory function for updating a user document.
 * @param {Sequelize.Model} Model - The Sequelize model.
 * @returns {function} - The controller function.
 */
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

/**
 * Factory function for adding additional user information.
 * @param {Sequelize.Model} Model - The Sequelize model.
 * @returns {function} - The controller function.
 */
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

/**
 * Factory function for deleting one document by primary key.
 * @param {Sequelize.Model} Model - The Sequelize model.
 * @returns {function} - The controller function.
 */
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const data = await Model.findByPk(req.params.id);
    await data.destroy();
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

/**
 * Factory function for sorting data by createdAt field.
 * @param {Sequelize.Model} Model - The Sequelize model.
 * @returns {function} - The controller function.
 */
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

/**
 * Factory function for searching data based on name and category.
 * @param {Sequelize.Model} Model - The Sequelize model.
 * @returns {function} - The controller function.
 */
exports.SearchData = (Model) =>
  catchAsync(async (req, res, next) => {
    const { name, order, page = 1, limit = 20, category } = req.query;

    // Initialize options object for the query
    const options = { where: {} };

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

/**
 * Factory function for creating one document.
 * @param {Sequelize.Model} Model - The Sequelize model.
 * @returns {function} - The controller function.
 */
exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const data = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data,
    });
  });

/**
 * Factory function for recommending items based on category.
 * @param {Sequelize.Model} Model - The Sequelize model.
 * @param {string} idField - The name of the ID field.
 * @param {string} categoryField - The name of the category field.
 * @param {string[]} attributes - The attributes to return.
 * @returns {function} - The controller function.
 */
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

/**
 * Factory function for getting user items.
 * @param {Sequelize.Model} Model1 - The main model.
 * @param {Sequelize.Model} Model2 - The embedded model.
 * @param {Sequelize.Includeable} category - Category to include.
 * @returns {function} - The controller function.
 */
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

/**
 * Factory function for fetching member data.
 * @param {Sequelize.Model} Model - The Sequelize model.
 * @param {string[]} field - The fields to fetch.
 * @returns {function} - The controller function.
 */
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
