const express = require('express');
const userController = require('../controllers/userController');
const customerController = require('../controllers/customerController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.get(
  '/getMe/additionalInfo',
  userController.getMe,
  customerController.getAdditionalInfo,
);

router.patch(
  '/updateMe',
  customerController.uploadProfile,
  customerController.resizeProfile,
  customerController.updateMe,
);

module.exports = router;
