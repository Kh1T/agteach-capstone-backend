const express = require('express');
const productController = require('../controllers/productController');
const authController = require('../controllers/authController');
const { uploadProductImages } = require('../utils/multerConfig');

const router = express.Router();

router.use(authController.protect);

router.post('/createProduct', uploadProductImages ,productController.createProduct);


module.exports = router;
