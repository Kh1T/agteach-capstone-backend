// const crypto = require("crypto");
// const { promisify } = require("util");
// const jwt = require("jsonwebtoken");
// const Email = require("./../utils/email");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.signup = catchAsync(async (req, res, next) => {
  try {
    const { username, email, password, passwordConfirm } = req.body;

    // Check if passwords match
    if (password !== passwordConfirm) {
      return next(new AppError("Passwords do not match!", 400));
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = await User.create({
      username, // Ensure this field is included
      email,
      password: hashedPassword,
    });

    // Send response
    res.status(201).json({
      status: "success",
      data: {
        user: newUser,
      },
    });
  } catch (error) {
    console.error("Error during user creation:", error);
    return next(new AppError("Error creating user!", 500));
  }
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ where: { email } });

  // Check if user exists and password is correct using bcrypt
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // 3) If everything ok, send token to client
  // createSendToken(user, 200, req, res);
});
