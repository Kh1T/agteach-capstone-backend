const UserAccount = require('../models/userModel');
const Instructor = require('../models/instructorModel');

const factory = require('./handlerFactory');
const { uploadProfileImage } = require('../utils/multerConfig');
const { resizeUploadProfileImage } = require('../utils/uploadMiddleware');
const catchAsync = require('../utils/catchAsync');

exports.getAdditionalInfo = factory.getOne(UserAccount, {
  include: [
    {
      model: Instructor,
      attributes: [
        'email',
        'phone',
        'address',
        'firstName',
        'lastName',
        'location_id',
        'dateOfBirth',
        'imageUrl',
      ],
    },
  ],
});

exports.uploadProfile = uploadProfileImage.single('photo');

exports.resizeProfile = resizeUploadProfileImage;

exports.addAdditionalInfo = factory.additionalInfo(Instructor);
exports.updateMe = factory.updateMe(Instructor);

exports.getInstructorData = catchAsync(async (req, res, next) => {
  console.log(req.user.userUid);
  // Fetch instructor data
  const instructor = await Instructor.findOne({
    where: { user_uid: req.user.userUid },
  });
  console.log(req.user.id);

  if (!instructor) {
    return res.status(404).json({ message: 'Instructor not found' });
  }

  // Respond with the instructor data
  res.status(200).json({
    status: 'success',
    data: instructor,
  });
});
