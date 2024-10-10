const express = require('express');
const enrollmentController = require('../controllers/enrollmentController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post(
  '/checkoutSession',
  authController.protect,
  enrollmentController.checkEnrollment,
  enrollmentController.getCheckoutSession,
);

module.exports = router;
