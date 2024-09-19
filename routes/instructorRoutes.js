const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const customerController = require('../controllers/customerController');
// const errorController = require('../controllers/errorController')

const router = express.Router();

router.use(authController.protect);

router.get(
  '/getInstructor/additionalInfo',
  userController.getMe,
  customerController.getAdditionalInfo,
);

module.exports = router;
