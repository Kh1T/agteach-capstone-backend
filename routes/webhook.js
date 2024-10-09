const express = require('express');
const webhookController = require('../controllers/webhookController');

const router = express.Router();

router.post(
  '/stripe-webhook',
  express.raw({ type: 'application/json' }),
  webhookController.webhookEnrollmentCheckout,
);

module.exports = router;
