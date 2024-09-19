const sharp = require('sharp');
const { PutObjectCommand } = require("@aws-sdk/client-s3");

const catchAsync = require('./catchAsync');
const s3Client = require('../config/s3Connection');

const resizeAndUpload = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next();
  }
  req.file.filename = `${req.user.role}s/${req.user.userUid}/profile-image.jpeg`;

  const buffer = await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toBuffer();

  const input = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: req.file.filename,
    Body: buffer,
    ContentType: "image/jpeg",
  };
  await s3Client.send(new PutObjectCommand(input));

});
