const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const instructorController = require('../controllers/instructorController');

const router = express.Router();

router.get(
  '/getInstructorDetail/:id',
  instructorController.getInstructorDetail,
);

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

router.get(
  '/balance',
  instructorController.fetchInstructor,
  instructorController.getBalance,
);
router.get(
  '/searchCourseBalance',
  instructorController.fetchInstructor,
  instructorController.getAllCourseBalance,
);
router.get(
  '/searchProductBalance',
  instructorController.fetchInstructor,
  instructorController.getAllProductBalance,
);
router.get(
  '/getRecentTransaction',
  instructorController.fetchInstructor,
  instructorController.getRecentTransations,
);



module.exports = router;
