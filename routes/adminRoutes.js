const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.use(authController.protect, authController.restrictTo('admin'));

router.get('/getAdminInfo', userController.getMe, adminController.getAdminInfo);

router.get('/getAllInstructors', adminController.getAllInstructor);

//Categories
router.get('/getAllCategories', adminController.getAllCategories);
router.get('/getCategory/:id', adminController.getCategory);
router.post('/createCategory', adminController.createCategory);
router.patch('/updateCategory/:id', adminController.updateCategory);
router.delete('/deleteCategory/:id', adminController.deleteCategory);

//Top 5 Sales
router.get('/getProductTopSales', adminController.getProductTopSales);

module.exports = router;
