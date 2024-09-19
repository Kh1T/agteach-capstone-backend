const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
// const errorController = require('../controllers/errorController')

const router = express.Router();

router.use(authController.protect);

router.get('/getAdminInfo', userController.getMe, adminController.getAdminInfo);

module.exports = router;
