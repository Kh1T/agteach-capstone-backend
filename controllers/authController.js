const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const UserAccount = require("../models/UserAccount");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken;
  const cookieOption = {
    // the date needed to convert to milliseconds
    expires: new Date(
      Date.now() + process.env.JWT_EXPIRES_COOKIE_IN * 24 * 60 * 60 * 1000,
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
  try {
    const { username, email, password, passwordConfirm, role } = req.body;

    // Check if passwords match
    if (password !== passwordConfirm) {
      return next(new AppError("Passwords do not match!", 400));
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = await UserAccount.create({
      username, // Ensure this field is included
      email,
      password: hashedPassword,
      role,
      user_uid: req.body.user_uid,
    });

    // Send response
    res.status(201).json({
      status: "success",
      data: {
        user: newUser,
      },
    });

    // createSendToken(newUser, 201, res);
  } catch (error) {
    console.error("Error during user creation:", error);
    return next(new AppError("Error creating user!", 500));
  }
});
