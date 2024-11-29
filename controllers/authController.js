/**
 * @file authController.js
 * @description This file contains the controller functions for user authentication.
 */

const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const AppError = require('../utils/appError');
const UserAccount = require('../models/userModel');
const Instructor = require('../models/instructorModel');
const Customer = require('../models/customerModel');
const catchAsync = require('../utils/catchAsync');
const sendEmail = require('../utils/sendEmail');
const cooldownRespond = require('../utils/cooldownRespond');

/**
 * Signs a JWT token with the user's ID.
 * @param {string} id - The user's ID.
 * @returns {string} The signed JWT token.
 */
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

/**
 * Creates and sends a JWT token to the client.
 * @param {Object} user - The user object.
 * @param {number} statusCode - The HTTP status code.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {boolean} [keepMeLoggedIn=false] - Whether to set a longer cookie expiration time.
 */
const createSendToken = (
  user,
  statusCode,
  req,
  res,
  keepMeLoggedIn = false,
) => {
  const token = signToken(user.userUid);
  const tokenExpiry = keepMeLoggedIn
    ? process.env.JWT_EXPIRES_COOKIE_LONG_IN
    : process.env.JWT_EXPIRES_COOKIE_IN;

  let domain = 'localhost';

  if (req.headers.origin) {
    const num = req.headers.origin.includes('www') ? 1 : 0;
    domain = req.headers.origin.split('/')[2].split('.')[num] || req.url;
  }

  const cookieOption = {
    expires: new Date(Date.now() + tokenExpiry * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: 'None',
    secure: true,
  };
  res.cookie(`jwt_${domain}`, token, cookieOption);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

/**
 * Handles user signup.
 * @async
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await UserAccount.create({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });

  if (newUser.role === 'instructor') {
    await Instructor.create({
      userUid: newUser.userUid,
      email: newUser.email,
    });
  } else if (newUser.role === 'guest') {
    await Customer.create({
      userUid: newUser.userUid,
      email: newUser.email,
    });
  }

  newUser.createEmailVerifyCode();

  createSendToken(newUser, 201, req, res);
});

/**
 * Handles user login.
 * @async
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
exports.login = catchAsync(async (req, res, next) => {
  const { email, password, keepMeLoggedIn } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  const user = await UserAccount.findOne({ where: { email } });

  if (!user || !user.authenticate(password)) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(user, 200, req, res, keepMeLoggedIn);
});

/**
 * Restricts access based on user role and origin.
 * @async
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
exports.roleRestrict = catchAsync(async (req, res, next) => {
  const user = await UserAccount.findOne({
    where: { email: req.body.email },
  });

  if (!user) {
    return next(new AppError('No user found', 404));
  }

  if (!req.headers.origin || req.headers.origin.includes('localhost')) {
    return next();
  }

  if (!user?.role) return next();
  let url = req.headers.origin.split('/')[2].split('.')[0] || req.url;
  console.log(url);
  if (url.includes('www')) url = req.headers.origin.split('/')[2].split('.')[1];

  const isAuthorized =
    (url.startsWith('instructor') && user.role === 'instructor') ||
    (url.startsWith('admin') && user.role === 'admin') ||
    (url.startsWith('alphabeez') && user.role === 'guest');

  if (isAuthorized) return next();

  return next(
    new AppError('You do not have permission to perform this action', 403),
  );
});

/**
 * Middleware to restrict access to certain routes based on user roles.
 * @param {...string} roles - The allowed roles.
 * @returns {function} - Middleware function.
 */
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };

/**
 * Handles forgot password requests.
 * @async
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await UserAccount.findOne({ where: { email: req.body.email } });

  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  const isCooldownActive = cooldownRespond(
    user.updatedAt,
    'password reset',
    res,
  );

  if (isCooldownActive) return;

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  user.updatePasswordChangedAt();

  let resetURL = `${req.protocol}://alphabeez.anbschool.org/auth/reset-password/${resetToken}`;

  if (user.role === 'instructor') {
    resetURL = resetURL.replace('alphabeez', 'instructor.alphabeez');
  }

  try {
    await sendEmail(user, {
      subject: 'Forgot password',
      code: resetURL,
      templateId: process.env.FORGOT_PASSWORD_EMAIL_TEMPLATE_ID,
    });

    res.status(200).json({
      status: 'success',
      resetToken,
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500,
    );
  }
});

/**
 * Handles password reset.
 * @async
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');

  const user = await UserAccount.findOne({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: { [Op.gt]: Date.now() },
    },
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.updatePasswordChangedAt();
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  createSendToken(user, 200, req, res);
});

/**
 * Handles updating the current user's password.
 * @async
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { password, passwordCurrent, passwordConfirm } = req.body;

  const user = await UserAccount.findByPk(req.user.userUid);

  if (!user.authenticate(passwordCurrent)) {
    return next(new AppError('Incorrect Password', 401));
  }

  if (password !== passwordConfirm) {
    return next(new AppError('Passwords do not match', 401));
  }

  user.password = password;
  user.passwordConfirm = passwordConfirm;

  await user.save();

  createSendToken(user, 200, req, res);
});

/**
 * Resends the email verification code.
 * @async
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
exports.resendVerifyCode = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const user = await UserAccount.findOne({ where: { email } });

  const isCooldownActive = cooldownRespond(user.updatedAt, 'email verify', res);

  if (isCooldownActive) return;
  await user.createEmailVerifyCode();
  await user.save();
  await sendEmail(user, {
    subject: 'Verify Email',
    templateId: process.env.SIGNUP_EMAIL_TEMPLATE_ID,
  });

  res.status(200).json({
    status: 'success',
    message: `Verification code resent successfully: ${user.emailVerifyCode}`,
  });
});

/**
 * Verifies the user's email.
 * @async
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
exports.verifyEmail = catchAsync(async (req, res, next) => {
  const { emailVerifyCode } = req.body;
  const user = await UserAccount.findOne({ where: { emailVerifyCode } });

  if (!user) {
    return next(new AppError('Invalid verification code', 400));
  }

  user.isVerify = true;
  user.emailVerifyCode = null;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Email successfully verified',
  });
});

/**
 * Handles user logout.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 */
exports.logout = (req, res) => {
  let domain = req.headers.origin.split('/')[2].split('.')[0] || req.url;

  if (req.headers.origin) {
    const num = req.headers.origin.includes('www') ? 1 : 0;
    domain = req.headers.origin.split('/')[2].split('.')[num] || req.url;
  }

  res.cookie(`jwt_${domain}`, 'logout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    sameSite: 'None',
    secure: true,
  });

  res.status(200).json({ status: 'success' });
};

/**
 * Protects routes that require authentication.
 * @async
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
exports.protect = catchAsync(async (req, res, next) => {
  let domain = 'localhost';
  if (req.headers.origin) {
    const num = req.headers.origin.includes('www') ? 1 : 0;
    domain = req.headers.origin.split('/')[2].split('.')[num] || req.url;
  }

  let token;
  if (req.cookies[`jwt_${domain}`]) {
    token = req.cookies[`jwt_${domain}`];
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access', 401),
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await UserAccount.findByPk(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401,
      ),
    );
  }

  req.user = currentUser;
  res.locals.user = currentUser;

  next();
});

/**
 * Custom validation middleware for checking if email and username already exist.
 * @async
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
exports.customValidate = async (req, res, next) => {
  const { email, username } = req.body;

  const [userEmail, userName] = await Promise.all([
    UserAccount.findOne({ where: { email } }),
    UserAccount.findOne({ where: { username } }),
  ]);

  if (userEmail || userName) {
    return next(
      new AppError(`${userEmail ? 'Email' : 'Username'} already exists`, 400),
    );
  }

  next();
};

/**
 * Checks if the user is logged in.
 * @async
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
exports.isLoginedIn = async (req, res, next) => {
  try {
    let domain = 'localhost';
    if (req.headers.origin) {
      const num = req.headers.origin.includes('www') ? 1 : 0;
      domain = req.headers.origin.split('/')[2].split('.')[num] || req.url;
    }

    if (req.cookies[`jwt_${domain}`]) {
      const decoded = await promisify(jwt.verify)(
        req.cookies[`jwt_${domain}`],
        process.env.JWT_SECRET,
      );

      const currentUser = await UserAccount.findByPk(decoded.id);
      if (!currentUser) {
        throw Error();
      }

      res.json({
        status: 'success',
        message: 'You are logged in',
        email: currentUser.email,
        IsVerify: currentUser.isVerify,
        IsAuthenticated: true,
      });
    } else {
      throw Error();
    }
  } catch (err) {
    res.json({
      status: 'fail',
      message: 'You are not logged in.',
      IsAuthenticated: false,
    });
  }
};
