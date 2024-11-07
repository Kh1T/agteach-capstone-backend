const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const AppError = require('../utils/appError');
const UserAccount = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const sendEmail = require('../utils/sendEmail');
const cooldownRespond = require('../utils/cooldownRespond');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

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
  // if (req.headers.origin)
  //   domain = req.headers.origin.split('/')[2].split('.')[0] || req.url;

  if (req.headers.origin) {
    const num = req.headers.origin.includes('www') ? 1 : 0;
    domain = req.headers.origin.split('/')[2].split('.')[num] || req.url;
  }

  const cookieOption = {
    expires: new Date(Date.now() + tokenExpiry * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: 'None',
    secure: true, // Add this line
    // domain, // Uncomment and set if needed
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

// Handle Signup User

exports.signup = catchAsync(async (req, res, next) => {
  // Create new user
  const newUser = await UserAccount.create({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });

  newUser.createEmailVerifyCode();

  createSendToken(newUser, 201, req, res);
});

// Handle Login User

exports.login = catchAsync(async (req, res, next) => {
  const { email, password, keepMeLoggedIn } = req.body;
  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2) Check if user exists && password is correct
  const user = await UserAccount.findOne({ where: { email } });

  // Check if password is correct

  if (!user.authenticate(password)) {
    return next(new AppError('Incorrect email or password', 401));
  }
  // 3) If everything ok, send token to client
  createSendToken(user, 200, req, res, keepMeLoggedIn);
});

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

// Handle Forget Password
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
  user.save({ validateBeforeSave: false });

  // Change field

  user.updatePasswordChangedAt();

  // 3) Send it to user's email
  // http://localhost:3000/auth/reset-password

  let resetURL = `${req.protocol}://agteach.site/auth/reset-password/${resetToken}`;

  if (user.role === 'instructor') {
    resetURL = resetURL.replace('agteach', 'teach.agteach');
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

exports.resetPassword = catchAsync(async (req, res, next) => {
  // DON"T FORGET TO CHANGE UPDATE TO req.params.token

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

// Update Current User Password

exports.updatePassword = catchAsync(async (req, res, next) => {
  // Get Current User
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

// Handle Email Verification Code

exports.resendVerifyCode = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  // Find the user by email
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

exports.verifyEmail = catchAsync(async (req, res, next) => {
  const { emailVerifyCode } = req.body;
  // Find the user with the provided verification code
  const user = await UserAccount.findOne({ where: { emailVerifyCode } });

  if (!user) {
    return next(new AppError('Invalid verification code', 400));
  }
  // Mark the user as verified
  user.isVerify = true;
  user.emailVerifyCode = null; // Clear the verification code
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Email successfully verified',
  });
});

exports.logout = (req, res) => {
  let domain = req.headers.origin.split('/')[2].split('.')[0] || req.url;

  if (req.headers.origin) {
    const num = req.headers.origin.includes('www') ? 1 : 0;
    domain = req.headers.origin.split('/')[2].split('.')[num] || req.url;
  }

  res.cookie(`jwt_${domain}`, 'logout', {
    expires: new Date(Date.now() + 10 * 1000), // make the cookie expire in 10 seconds
    httpOnly: true,
    sameSite: 'None',
    secure: true, // Add this line
  });

  res.status(200).json({ status: 'success' });
};

// Handle Protected Routes (Requires Authentication)

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

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await UserAccount.findByPk(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401,
      ),
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;

  next();
});

exports.customValidate = async (req, res, next) => {
  const { email, username } = req.body;

  const [userEmail, userName] = await Promise.all([
    UserAccount.findOne({ where: { email } }),
    UserAccount.findOne({ where: { username } }),
  ]);

  if (userEmail || userName) {
    return next(new AppError('User already exists', 400));
  }

  next();
};

exports.isLoginedIn = async (req, res, next) => {
  try {
    let domain = 'localhost';
    if (req.headers.origin) {
      const num = req.headers.origin.includes('www') ? 1 : 0;
      domain = req.headers.origin.split('/')[2].split('.')[num] || req.url;
    }

    if (req.cookies[`jwt_${domain}`]) {
      // 2) Verification token
      const decoded = await promisify(jwt.verify)(
        req.cookies[`jwt_${domain}`],
        process.env.JWT_SECRET,
      );

      // 3) Check if user still exists
      const currentUser = await UserAccount.findByPk(decoded.id);
      if (!currentUser) {
        throw Error();
      }
      // GRANT ACCESS TO PROTECTED ROUTE

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
