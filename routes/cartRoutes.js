const express = require('express');
const cartController = require('../controllers/cartController');

const router = express.Router();

router.get('/cart', cartController.getCartItems);

module.exports = router;
