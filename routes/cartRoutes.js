const express = require('express');
const cartController = require('../controllers/cartController');

const router = express.Router();

router.get('/getCartItems', cartController.getCartItems);

module.exports = router;
