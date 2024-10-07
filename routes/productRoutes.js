const express = require('express');
const productController = require('../controllers/productController');
const { uploadProductImages } = require('../utils/multerConfig');

const authController = require('../controllers/authController');

const router = express.Router();

router.get('/searchData', productController.searchData);
router.get('/getAllProduct', productController.getAll);

router.use(authController.protect, authController.restrictTo('instructor'));

router.get('/getOneProduct/:id', productController.getProductDetail);
router.delete('/deleteOneProduct/:id', productController.deleteOne);
router.post(
  '/createProduct',
  uploadProductImages,
  productController.createProduct,
);

module.exports = router;
