const express = require('express');
const purchasedController = require('../controllers/purchasedController');
const authController = require('../controllers/authController');
const customerController = require('../controllers/customerController')

const router = express.Router();

router.post(
  '/productCheckoutSession',
  authController.protect,
  customerController.fetchCustomer,
  purchasedController.getCheckoutSession,
);

module.exports = router;