const { promisify } = require("util");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const AppError = require("../utils/appError");
const UserAccount = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { resendCode } = require("../utils/resendCode");
const sendEmail = require("../utils/sendEmail");

// const { resendCode } = require("../utils/resendCode");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.userUid);
  const cookieOption = {
    // the date needed to convert to milliseconds
    expires: new Date(
      Date.now() + process.env.JWT_EXPIRES_COOKIE_IN * 24 * 60 * 60 * 1000
    ),
    // this will make the cookie can not be modify or anything from browser
    httpOnly: true,
  };

  res.cookie("jwt", token, cookieOption);

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // Create new user
  const newUser = await UserAccount.create({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });

  createSendToken(newUser, 201, res);
});

exports.resendVerifyCode = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  // Find the user by email
  const user = await UserAccount.findOne({ where: { email } });
  // Reset the verification code
  const verificationCode = user.createEmailVerifyCode();

  // check if the cool down is active
  const lastSent = user.updatedAt;
  const cooldownDuration = 1 * 60 * 1000; // 1 minute
  const timeDifference = Date.now() - new Date(lastSent).getTime();
  const isCooldownActive = timeDifference < cooldownDuration;

  if (isCooldownActive) {
    return res.status(429).json({
      status: "fail",
      message: "Your verification is in cooldown 1 minute.",
    });
  }

  // Update user and resend code
  user.updatedAt = new Date(); // Update the timestamp
  await user.save(); // Save the changes

  // Send email
  await sendEmail(user, {
    subject: "Here is your new verification code.",
    text: `Here is your new verification code: ${verificationCode}. Please enter this code on the verification page to complete your registration.`,
  });
  res.status(200).json({
    status: "success",
    message: `Verification code resent successfully: ${verificationCode}`,
  });
});

exports.verifyEmail = catchAsync(async (req, res, next) => {
  const { emailVerifyCode } = req.body;
  // Find the user with the provided verification code
  const user = await UserAccount.findOne({ where: { emailVerifyCode } });

  if (!user) {
    return next(new AppError("Invalid verification code", 400));
  }
  // Mark the user as verified
  user.isVerified = true;
  user.emailVerifyCode = null; // Clear the verification code
  await user.save();

  res.status(200).json({
    status: "success",
    message: "Email successfully verified",
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }

  // 2) Check if user exists && password is correct
  const user = await UserAccount.findOne({ where: { email } });

  // Check if password is correct

  if (!user.authenticate(password)) {
    return next(new AppError("Incorrect email or password", 401));
  }
  // 3) If everything ok, send token to client
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access", 401)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // console.log(token);

  // 3) Check if user still exists
  const currentUser = await UserAccount.findByPk(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;

  next();
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await UserAccount.findOne({ where: { email: req.body.email } });

  if (!user) {
    return next(new AppError("There is no user with email address.", 404));
  }

  const resetToken = user.createPasswordResetToken();
  user.save({ validateBeforeSave: false });

  // Change field

  user.updatePasswordChangedAt();

  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm`;

  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: "Your password reset token (valid for 10 min)",
    //   message,
    // });
    console.log("hi");
    await sendEmail(user, {
      subject: "Forgot password",
      text: message,
      code: resetURL,
    });

    res.status(200).json({
      status: "success",
      resetToken,
      message: "Token sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an error sending the email. Try again later!"),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // DON"T FORGET TO CHANGE UPDATE TO req.params.token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.body.token)
    .digest("hex");

  const user = await UserAccount.findOne({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: { [Op.gt]: Date.now() },
    },
  });

  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  createSendToken(user, 200, res);
  console.log("hi");
});
