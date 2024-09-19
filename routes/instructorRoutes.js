const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const instructorController = require('../controllers/instructorController');

const router = express.Router();

router.use(authController.protect);

router.get('/getLocation', instructorController.getLocation);

router.get(
  '/getInstructor/additionalInfo',
  userController.getMe,
  instructorController.getAdditionalInfo,
);

router.post('/addAdditionalInfo', instructorController.addAdditionalInfo);
router.patch('/updateMe', instructorController.updateMe);

module.exports = router;
