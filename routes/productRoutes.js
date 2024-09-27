const express = require('express');
const productController = require('../controllers/productController');
const { uploadProductImages } = require('../utils/multerConfig');

const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect, authController.restrictTo('instructor'));

router.get('/getAllProduct', productController.getAll);
router.get('/getOneProduct/:id', productController.getOne);
router.delete('/deleteOneProduct/:id', productController.deleteOne);
router.get('/searchData', productController.searchData);
router.get('/sortData', productController.sortData);
router.post(
  '/createProduct',
  uploadProductImages,
  productController.createProduct,
);

router.post(
  '/createProduct',
  uploadProductImages,
  productController.createProduct,
);

module.exports = router;
