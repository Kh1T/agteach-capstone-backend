const { promisify } = require("util");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { Op, where } = require("sequelize");
const AppError = require("../utils/appError");
const UserAccount = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const sendEmail = require("../utils/sendEmail");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.userUid);
  const cookieOption = {
    expires: new Date(
      Date.now() + process.env.JWT_EXPIRES_COOKIE_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    sameSite: "None",
    secure: true, // Add this line
    // domain: 'your-domain.com', // Uncomment and set if needed
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

  createSendToken(newUser, 201, res);
});

exports.additionalInfo = catchAsync(async (req, res, next) => {

})

// Handle Login User

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

// Handle Forget Password
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
  // http://localhost:3000/auth/reset-password
  const resetURL = `${req.protocol}://localhost:3000/auth/reset-password/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm`;

  try {
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
      500,
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // DON"T FORGET TO CHANGE UPDATE TO req.params.token

  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
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

  user.updatePasswordChangedAt();
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  createSendToken(user, 200, res);
});

// Handle Email Verification Code

exports.resendVerifyCode = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  // Find the user by email
  const user = await UserAccount.findOne({ where: { email } });

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
  const verificationCode = user.createEmailVerifyCode();

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
  user.isVerify = true;
  user.emailVerifyCode = null; // Clear the verification code
  await user.save();

  res.status(200).json({
    status: "success",
    message: "Email successfully verified",
  });
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000), // make the cookie expire in 10 seconds
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

// Handle Protected Routes (Requires Authentication)

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
      new AppError("You are not logged in! Please log in to get access", 401),
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
        401,
      ),
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;

  next();
});

exports.customValidate = async (req,res,next) => {
  const { email, username } = req.body;

  const [userEmail, userName] = await Promise.all([
    UserAccount.findOne({ where: { email } }),
    UserAccount.findOne({ where: { username } })
  ]);

  console.log(userEmail);

  if (userEmail || userName) {
    return next(new AppError('User already exists', 400));
  }

  next()
}