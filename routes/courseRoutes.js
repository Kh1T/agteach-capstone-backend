const express = require('express');
const courseController = require('../controllers/courseController');
const authController = require('../controllers/authController');
const instructorController = require('../controllers/instructorController');
const { uploadCourseVideos } = require('../utils/multerConfig');

const router = express.Router();

router.get('/getAllCourse', courseController.getAll);
router.get('/getOneCourse/:id', courseController.getOne);
router.get('/searchData', courseController.searchData);
// router.get('/getRecommendCourse/:id', courseController.recommendCourse);

router.delete('/deleteOneCourse/:id', courseController.deleteOne);

router.use(authController.protect);
router.post(
  '/uploadCourse',
  uploadCourseVideos,
  courseController.uploadCourse,
);


module.exports = router;
