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

router.post(
  '/checkoutSession',
  enrollmentController.checkEnrollment,
  enrollmentController.getCheckoutSession,
);

module.exports = router;
