const express = require('express');
const courseController = require('../controllers/courseController');
const authController = require('../controllers/authController');

const router = express.Router();

router.get('/getAllCourse', courseController.getAll);
router.get('/getOneCourse/:id', courseController.getOne);
router.get('/searchData', courseController.searchData);
router.delete('/deleteOneCourse/:id', courseController.deleteOne);

router.use(authController.protect);
router.post('/uploadCourse', courseController.uploadCourse);
// router.get('/sortData', courseController.sortData);

module.exports = router;
