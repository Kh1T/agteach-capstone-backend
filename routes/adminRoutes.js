const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.use(authController.protect);

router.get('/getAdminInfo', adminController.getAdminInfo);

router.get('/getAllInstructors', adminController.getAllInstructor);

//Categories
router.get('/getAllCategories', adminController.getAllCategories);
router.get('/getCategory/:id', adminController.getCategory);
router.post('/createCategory', adminController.createCategory);
router.patch('/updateCategory/:id', adminController.updateCategory);
router.delete('/deleteCategory/:id', adminController.deleteCategory);

//Dashboard
router.get('/getProductTopSales', adminController.getProductTopSales);
router.get('/getCourseTopSales', adminController.getCourseTopSales);
router.get('/getSalesOverview', adminController.getSalesOverview);

module.exports = router;
