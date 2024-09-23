const express = require('express');
const productController = require('../controllers/productController');

const router = express.Router();

router.get('/getAllProduct', productController.getMe);

module.exports = router;