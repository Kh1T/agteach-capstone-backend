const express = require('express');
const instructorController = require('../controllers/instructorController');
const enrollmentController = require('../controllers/enrollmentController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.get(
  '/getEnrollment',
  instructorController.fetchInstructor,
  enrollmentController.getEnrollment,
);

router.get(
  '/getEnrollmentDetail/:id',
  enrollmentController.getEnrollmentDetail,
);

router.post(
  '/checkoutSession',
  enrollmentController.checkEnrollment,
  enrollmentController.getCheckoutSession,
);

module.exports = router;
