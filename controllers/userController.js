const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  console.log(req.body);

  // if (req.body.password || req.body.passwordConfirm) {
  //   return next(
  //     new AppError(
  //       "This route is not for password updates. Please use /updateMyPassword.",
  //       400
  //     )
  //   );
  // }
  // // Get the updated user
  // const user = await User.findByPk(req.user.userUid);

  // // 2) Filtered out unwanted fields names that are not allowed to be updated
  // const filteredBody = filterObj(req.body, "email");
  // if (req.file) filteredBody.photo = req.file.filename;

  // // 3) Update user document
  // const updatedUser = await User.update(filteredBody, {
  //   where: { userUid: req.user.userUid },
  //   returning: true,
  //   individualHooks: true, // to run validators
  // });

  res.status(200).json({
    status: "success",
    data: {
      user: req.user,
    },
  });
});
