const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // const doc = await Model.findById(req.params.uid).populate({
    //   path: 'location',
    //   select: 'location_id',
    // });

    // if (!doc) {
    //   return next(new AppError('No Document found with that ID', 404));
    // }

    res.status(200).json({
      status: 'success',
      data: {
        // data: doc,
        message: 'success, on get one',
      },
    });
  });
