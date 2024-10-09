const express = require('express');
const productController = require('../controllers/productController');
const { uploadProductImages } = require('../utils/multerConfig');

const authController = require('../controllers/authController');
const { route } = require('./userRoutes');

const router = express.Router();

router.get('/searchData', productController.searchData);
router.get('/getAllProduct', productController.getAll);
router.get('/getProductDetail/:id', productController.getProductDetail);
router.get('/getRecommendProduct/:id', productController.recommendProduct);

router.use(authController.protect, authController.restrictTo('instructor'));

router.get('/getInstructorProduct', productController.getInstructorProduct);

router.delete('/deleteOneProduct/:id', productController.deleteOne);
router.post(
  '/createProduct',
  uploadProductImages,
  productController.createProduct,
);

module.exports = router;
