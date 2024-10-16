const express = require('express');
const cartController = require('../controllers/cartController');

const router = express.Router();

router.post('/getCartItems', cartController.getCartItems);

module.exports = router;
