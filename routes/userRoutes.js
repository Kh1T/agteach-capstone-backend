const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const customerController = require('../controllers/customerController');

const router = express.Router();

//  User Authentication Routes

router.get('/getLocation', userController.getLocation);
router.get('/isLoginedIn', authController.isLoginedIn);

router.post('/signup', authController.customValidate, authController.signup);

router.post('/login', authController.roleRestrict, authController.login);
router.post('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:resetToken', authController.resetPassword);

//  Protected Routes (Requires Authentication)
router.use(authController.protect);
router.patch('/updatePassword', authController.updatePassword);
router.post('/signup/additionalInfo', customerController.addAdditionalInfo);

router.post('/resendCode', authController.resendVerifyCode);
router.post('/verifyEmail', authController.verifyEmail);

router.get('/getMe', userController.getMe);
router.patch('/updateMe', userController.updateMe);

module.exports = router;
