const express = require('express');
const enrollmentController = require('../controllers/enrollmentController');

const router = express.Router();

router.get('/checkout-session', enrollmentController);

module.exports = router;
