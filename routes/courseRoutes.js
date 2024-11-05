const express = require('express');
const courseController = require('../controllers/courseController');
const authController = require('../controllers/authController');
const instructorController = require('../controllers/instructorController');
const { uploadCourseVideosMulter } = require('../utils/multerConfig');
const enrollmentController = require('../controllers/enrollmentController');
const customerController = require('../controllers/customerController');

const router = express.Router();

// For CyberNexus
router.get('/getAllCourseDisplay', courseController.getAllCourseDisplay);

router.get('/getAllCourse', courseController.getAll);
router.get('/getOneCourse/:id', courseController.getOne);
router.get('/searchData', courseController.searchData);
router.get('/getRecommendCourse/:id', courseController.recommendCourse);

router.delete('/deleteOneCourse/:id', courseController.deleteOne);

router.use(authController.protect);
router.use(uploadCourseVideosMulter.any());

router.get(
  '/getOneCourseDetail/:id',
  instructorController.fetchInstructor,
  courseController.getOne,
);

router.get('/getInstructorCourse', courseController.getInstructorCourse);
router.get(
  '/getEnrollmentCourse/:id',
  customerController.fetchCustomer,
  enrollmentController.checkCourseEnroll,
  courseController.getCourseVideo,
);

router.post(
  '/uploadCourse',
  instructorController.fetchInstructor,
  courseController.uploadCourse,
);

router.patch(
  '/updateCourse/:id',
  instructorController.fetchInstructor,
  courseController.updateCourse,
);

module.exports = router;
