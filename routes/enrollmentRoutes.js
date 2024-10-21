const express = require('express');
const instructorController = require('../controllers/instructorController');
const enrollmentController = require('../controllers/enrollmentController');
const authController = require('../controllers/authController');
const customerController = require('../controllers/customerController');

const router = express.Router();

router.use(authController.protect);

router.get(
  '/getEnrollment',
  instructorController.fetchInstructor,
  enrollmentController.getEnrollment,
);

router.get(
  '/getCustomerEnrollments',
  customerController.fetchCustomer,
  enrollmentController.getCustomerEnrollments,
);

router.get(
  '/getEnrollmentDetail/:id',
  enrollmentController.getEnrollmentDetail,
);
router.get('/checkEnrollment', customerController.fetchCustomer, enrollmentController.checkEnrollment);

router.post(
  '/checkoutSession',
  customerController.fetchCustomer,
  enrollmentController.checkEnrollment,
  enrollmentController.getCheckoutSession,
);

router.get(
  '/getUserEnrollments',
  customerController.fetchCustomer,
  enrollmentController.getUserEnrollments,
);

module.exports = router;
