const express = require('express');
const courseController = require('../controllers/courseController');
const authController = require('../controllers/authController');
const instructorController = require('../controllers/instructorController');
const { uploadCourseVideos } = require('../utils/multerConfig');

const router = express.Router();

router.get('/getAllCourse', courseController.getAll);
router.get('/getOneCourse/:id', courseController.getOne);
router.get('/searchData', courseController.searchData);

router.delete('/deleteOneCourse/:id', courseController.deleteOne);

router.use(authController.protect);
router.get('/getInstructorCourse', courseController.getInstructorCourse);

router.use(uploadCourseVideos);
router.patch('/:id', courseController.updateCourse);

router.post(
  '/uploadCourse',
  instructorController.fetchInstructor,
  courseController.uploadCourse,
);

// router.post('/uploadCourse', courseController.uploadCourse);
// router.get('/sortData', courseController.sortData);

module.exports = router;
