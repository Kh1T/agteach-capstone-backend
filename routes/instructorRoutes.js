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

router.patch(
  '/addVerificationData',
  instructorController.fetchInstructor,
  instructorController.addVerificationData,
);

router.post('/addAdditionalInfo', instructorController.addAdditionalInfo);
router.patch(
  '/updateMe',
  instructorController.uploadProfile,
  instructorController.resizeProfile,
  instructorController.updateMe,
);

router.get('/getInstructor/data', instructorController.getInstructorData);

router.use(instructorController.fetchInstructor);
router.get('/balance', instructorController.getBalance);
router.get('/searchCourseBalance', instructorController.getAllCourseBalance);
router.get('/searchProductBalance', instructorController.getAllProductBalance);
router.get('/getRecentTransaction', instructorController.getRecentTransations);

//Dashboard
router.get(
  '/getInstructorOverviewSales',
  instructorController.getInstructorOverviewSales,
);
router.get(
  '/getInstructorProductTopSales',
  instructorController.getInstructorProductTopSales,
);
router.get(
  '/getInstructorCourseTopSales',
  instructorController.getInstructorCourseTopSales,
);
module.exports = router;
