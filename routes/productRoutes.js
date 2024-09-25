const express = require('express');
const authController = require('../controllers/authController');
const productController = require('../controllers/productController');

const router = express.Router();

// router.use(authController.protect);

router.get(
  '/getAllProduct',
  productController.getAll,
);

module.exports = router;
