const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.use(authController.protect, authController.restrictTo('admin'));

router.get('/getAdminInfo', userController.getMe, adminController.getAdminInfo);

module.exports = router;
