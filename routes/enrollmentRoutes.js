const express = require('express');
const enrollmentController = require('../controllers/enrollmentController');

const router = express.Router();

router.post('/checkout-session', enrollmentController.getCheckoutSession);

module.exports = router;
