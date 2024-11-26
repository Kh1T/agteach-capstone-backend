/**
 * @module errorController
 * @description This module handles errors in the application.
 */

/**
 * @requires ../utils/appError
 */
const AppError = require('../utils/appError');

/**
 * @function handleCastErrorDB
 * @description Handles CastError database errors.
 * @param {Error} err - The error object.
 * @returns {AppError} - A new AppError object.
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

/**
 * @function handleDuplicateFieldsDB
 * @description Handles duplicate field database errors.
 * @param {Error} err - The error object.
 * @returns {AppError} - A new AppError object.
 */
const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

/**
 * @function handleValidationErrorDB
 * @description Handles validation errors.
 * @param {Error} err - The error object.
 * @returns {AppError} - A new AppError object.
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

/**
 * @function handleJWTError
 * @description Handles JWT errors.
 * @returns {AppError} - A new AppError object.
 */
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

/**
 * @function handleJWTExpiredError
 * @description Handles JWT expired errors.
 * @returns {AppError} - A new AppError object.
 */
const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

/**
 * @function sendErrorDev
 * @description Sends error response in development environment.
 * @param {Error} err - The error object.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
const sendErrorDev = (err, req, res) =>
  // A) API
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });

/**
 * @function sendErrorProd
 * @description Sends error response in production environment.
 * @param {Error} err - The error object.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
const sendErrorProd = (err, req, res) => {
  // A) API
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
};

/**
 * @function globalErrorHandler
 * @description Global error handler middleware.
 * @param {Error} err - The error object.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
module.exports = (err, req, res, next) => {
  if (
    err.name === 'SequelizeUniqueConstraintError' &&
    process.env.NODE_ENV === 'development'
  ) {
    err.message = err.errors[0].message;
  }

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};
