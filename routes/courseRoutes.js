const express = require('express');
const courseController = require('../controllers/courseController');
const authController = require('../controllers/authController');
// const { uploadCourseVideosFile } = require('../utils/uploadMiddleware');

const router = express.Router();

router.get('/getAllCourse', courseController.getAll);
router.get('/getOneCourse/:id', courseController.getOne);
router.get('/searchData', courseController.searchData);

router.use(authController.protect);
router.post('/uploadCourse', courseController.uploadCourseVideo, courseController.uploadCourse);

// router.get('/sortData', courseController.sortData);

module.exports = router;
