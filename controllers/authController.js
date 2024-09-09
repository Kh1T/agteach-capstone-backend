const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const UserAccount = require("../models/UserAccount");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.user_uid);
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

// const createSendToken = (user, statusCode, res) => {
//   const token = signToken(user._id);
//   const cookieOption = {
//     // the date needed to convert to milliseconds
//     expires: new Date(
//       Date.now() + process.env.JWT_EXPIRES_COOKIE_IN * 24 * 60 * 60 * 1000
//     ),
//     // this will make the cookie can not be modify or anything from browser
//     httpOnly: true
//   };

//   if (process.env.NODE_ENV === 'production') cookieOption.secure = true;

//   res.cookie('jwt', token, cookieOption);

//   res.status(statusCode).json({
//     status: 'success',
//     token,
//     data: {
//       user
//     }
//   });
// };

exports.signup = catchAsync(async (req, res, next) => {
  try {
    const { username, email, password, passwordConfirm, role } = req.body;

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
      username, // Ensure this field is included
      email,
      password,
      role,
    });

    // Send response
    res.status(201).json({
      status: "success",
      data: {
        user: newUser,
      },
    });

    createSendToken(newUser, 201, res);
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
  const user = await UserAccount.findOne({ where: { email } });

  // Check if user exists and password is correct using bcrypt
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // 3) If everything ok, send token to client
  // createSendToken(user, 200, req, res);
  const tour = createSendToken(user, 200, res);
  res.status(200).json({
    status: "success",
    message: "Login successful",
  });
});

// exports.protect = catchAsync(async (req, res, next) => {
//   let token;
// });
