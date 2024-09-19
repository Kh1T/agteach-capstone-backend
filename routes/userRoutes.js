const express = require('express');
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

router.get('/isLoginedIn', authController.isLoginedIn);

//  Protected Routes (Requires Authentication)

router.use(authController.protect);

router.post(
  '/signup/additionalInfo',
  authController.isLoginedIn,
  customerController.additionalInfo,
);
router.post('/resendCode', authController.resendVerifyCode);
router.post('/verifyEmail', authController.verifyEmail);

router.patch('/updateMe', userController.updateMe);

module.exports = router;
