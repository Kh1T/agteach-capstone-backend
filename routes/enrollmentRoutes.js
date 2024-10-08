const express = require('express');
const enrollmentController = require('../controllers/enrollmentController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post(
  '/checkout-session',
  authController.protect,
  enrollmentController.getCheckoutSession,
);

module.exports = router;
