const express = require('express');
const purchasedController = require('../controllers/purchasedController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post(
  '/productCheckoutSession',
  authController.protect,
  purchasedController.getCheckoutSession,
);

module.exports = router;