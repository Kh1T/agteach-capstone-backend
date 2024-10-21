const express = require('express');
const purchasedController = require('../controllers/purchasedController');
const authController = require('../controllers/authController');
const customerController = require('../controllers/customerController');
const instructorController = require('../controllers/instructorController');

const router = express.Router();

router.use(authController.protect);

router.get(
  '/getCustomerPurchased',
  customerController.fetchCustomer,
  purchasedController.getCustomerPurchased,
);

router.patch('/updateDeliver', purchasedController.updateDeliver);

router.get(
  '/getInstructorPurchased',
  instructorController.fetchInstructor,
  purchasedController.getAllPurchased,
);

router.get(
  '/purchasedDetail/:id',
  instructorController.fetchInstructor,
  purchasedController.getPurchaseDetail,
);

router.post(
  '/productCheckoutSession',
  customerController.fetchCustomer,
  purchasedController.getCheckoutSession,
);

module.exports = router;
