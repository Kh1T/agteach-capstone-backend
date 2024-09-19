const express = require('express');
const AppError = require('./../utils/appError');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const customerController = require('../controllers/customerController');
// const errorController = require('../controllers/errorController')

const router = express.Router();

//  User Authentication Routes

router.post('/signup', authController.customValidate, authController.signup);

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:resetToken', authController.resetPassword);

//  Protected Routes (Requires Authentication)

router.use(authController.protect);

router.post('/signup/additionalInfo', customerController.additionalInfo);
router.post('/resendCode', authController.resendVerifyCode);
router.post('/verifyEmail', authController.verifyEmail);

router.get('/getMe', userController.getMe);
router.get(
  '/getMe/additionalInfo',
  userController.getMe,
  customerController.getAdditionalInfo,
);
router.patch('/updateMe', userController.updateMe);

module.exports = router;
