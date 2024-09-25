const express = require('express');
const authController = require('../controllers/authController');
const productController = require('../controllers/productController');

const router = express.Router();

// router.use(authController.protect);

router.get('/getAllProduct', productController.getAll);
router.get('/getOneProduct/:id', productController.getOne);
router.delete('/deleteOneProduct/:id', productController.deleteOne);
router.get('/searchData', productController.searchData);

module.exports = router;
