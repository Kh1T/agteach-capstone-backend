const express = require('express');
const productController = require('../controllers/productController');
const authController = require('../controllers/authController');
const { uploadProductImages } = require('../utils/multerConfig');

const router = express.Router();

router.use(authController.protect);

router.get('/getAllProduct', productController.getAll);

router.delete('/deleteOneProduct/:id', productController.deleteOne);

router.get('/searchData', productController.searchData);

router.post(
  '/createProduct',
  uploadProductImages,
  productController.createProduct,
);


module.exports = router;
