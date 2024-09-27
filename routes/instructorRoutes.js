const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const instructorController = require('../controllers/instructorController');

const router = express.Router();

router.use(authController.protect);

router.get(
  '/getInstructor/additionalInfo',
  userController.getMe,
  instructorController.getAdditionalInfo,
);

router.post('/addAdditionalInfo', instructorController.addAdditionalInfo);
router.patch(
  '/updateMe',
  instructorController.uploadProfile,
  instructorController.resizeProfile,
  instructorController.updateMe,
);

router.get('/getInstructor/data', instructorController.getInstructorData);

module.exports = router;
