const express = require('express');
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.get('/getAllCategories', adminController.getAllCategories);

router.use(authController.protect, authController.restrictTo('admin'));

router.patch('/verifyInstructor/:id', adminController.verifyInstructor);

router.get('/getAdminInfo', adminController.getAdminInfo);

router.get('/getAllInstructors', adminController.getAllInstructor);
router.get('/getAllCustomers', adminController.getAllCustomers);

//Categories
router.get('/getCategory/:id', adminController.getCategory);
router.get('/searchCategory', adminController.searchCategory);
router.post('/createCategory', adminController.createCategory);
router.patch('/updateCategory/:id', adminController.updateCategory);
router.delete('/deleteCategory/:id', adminController.deleteCategory);

//Dashboard
router.get('/getProductTopSales', adminController.getProductTopSales);
router.get('/getCourseTopSales', adminController.getCourseTopSales);
router.get('/getSalesOverview', adminController.getSalesOverview);

module.exports = router;
