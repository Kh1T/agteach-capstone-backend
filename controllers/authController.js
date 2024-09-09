const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const UserAccount = require("../models/UserAccount");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const bcrypt = require("bcryptjs");
const UserAccount = require("../models/UserAccount");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.user_uid);
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
  const { email, password, passwordConfirm } = req.body;

  // Check if passwords match
  if (password !== passwordConfirm) {
    return next(new AppError("Passwords do not match!", 400));
  }

  // Check if user already exists
  const existingUser = await UserAccount.findOne({ where: { email } });

  if (existingUser) {
    return next(new AppError("Email is already in use", 400));
  }

  // Create new user
  const newUser = await UserAccount.create({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
    user_uid: req.body.user_uid,
  });

  // Send response
  res.status(201).json({
    status: "success",
    data: {
      user: newUser,
    },
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

  // Check if user exists and password is correct using bcrypt
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // 3) If everything ok, send token to client
  createSendToken(user, 200, req, res);
  res.status(200).json({
    status: "success",
    message: "Login successful",
  });
});
