const express = require('express');
const authController = require('../controllers/authController');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

router.use(authController.protect);

router.get('/session/:sessionId', paymentController.getPaymentSession);

module.exports = router;