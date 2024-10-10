const express = require('express');
const productController = require('../controllers/productController');
const authController = require('../controllers/authController');
const { uploadProductImages } = require('../utils/multerConfig');

const router = express.Router();

router.get('/searchData', productController.searchData);
router.get('/getAllProduct', productController.getAll);
router.get('/getProductDetail/:id', productController.getProductDetail);
router.get('/getRecommendProduct/:id', productController.recommendProduct);

router.use(authController.protect, authController.restrictTo('instructor'));

router.get('/getInstructorProduct', productController.getInstructorProduct);

router.delete('/deleteOneProduct/:id', productController.deleteOne);
router.get('/searchData', productController.searchData);
router.get('/sortData', productController.sortData);
router.post(
  '/createProduct',
  uploadProductImages,
  productController.createProduct,
);

router.patch(
  '/updateProduct/:id',
  uploadProductImages,
  productController.updateProduct,
);
router.get('/getProductImages/:id', productController.getProductImages);

module.exports = router;
