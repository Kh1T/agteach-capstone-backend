const jwt = require("jsonwebtoken");

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
