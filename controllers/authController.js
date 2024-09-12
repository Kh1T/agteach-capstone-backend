/* eslint-disable no-undef */
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const UserAccount = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { resendCode } = require("../utils/resendCode");

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
  // Optional: Check for a cooldown period (e.g., 1 minute)
  const lastSent = user.updatedAt;
  console.log("last Send:", lastSent);
  const isCooldownActive =
    Date.now() - new Date(lastSent).getTime() < 1 * 60 * 1000;
  console.log("Is cooldown active:", isCooldownActive);

  if (isCooldownActive) {
    return res
      .status(429)
      .send("Please wait a minute before resending the verification code.");
  }

  // Resend the verification code
  // const newCode = await resendCode(user);
  res.send(`Verification code resent successfully: ${newCode}`);
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

exports.resendVerifyCode = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  // Find the user by email
  const user = await UserAccount.findOne({ where: { email } });
  // Optional: Check for a cooldown period (e.g., 1 minute)
  const lastSent = user.updatedAt;
  const isCooldownActive = Date.now() - new Date(lastSent) < 1 * 60 * 1000;
  if (isCooldownActive) {
    return res
      .status(429)
      .send("Please wait a minute before resending the verification code.");
  }

  // Resend the verification code
  const newCode = await resendCode(user);
  res.send(`Verification code resent successfully: ${newCode}`);
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

  res.json({ status: "success", resetToken });

  // try {
  //   await sendEmail({
  //     email: user.email,
  //     subject: "Your password reset token (valid for 10 min)",
  //     message,
  //   });

  //   res.status(200).json({
  //     status: "success",
  //     message: "Token sent to email!",
  //   });
  // } catch (err) {
  //   user.passwordResetToken = undefined;
  //   user.passwordResetExpires = undefined;
  //   await user.save({ validateBeforeSave: false });

  //   return next(
  //     new AppError("There was an error sending the email. Try again later!"),
  //     500
  //   );
  // }
});
