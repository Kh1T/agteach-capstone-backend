const express = require('express');
const courseController = require('../controllers/courseController');
const authController = require('../controllers/authController');
const instructorController = require('../controllers/instructorController');
const { uploadCourseVideosMulter } = require('../utils/multerConfig');
const enrollmentController = require('../controllers/enrollmentController');
const customerController = require('../controllers/customerController');

const router = express.Router();

router.get('/getAllCourse', courseController.getAll);
router.get('/getOneCourse/:id', courseController.getOne);
router.get('/searchData', courseController.searchData);
router.get('/getRecommendCourse/:id', courseController.recommendCourse);


router.delete('/deleteOneCourse/:id', courseController.deleteOne);

router.use(authController.protect);
router.use(uploadCourseVideosMulter.any());

router.get('/getInstructorCourse', courseController.getInstructorCourse);
router.get(
  '/getEnrollmentCourse/:id',
  customerController.fetchCustomer,
  enrollmentController.checkCourseEnroll,
  courseController.getOne,
);

router.patch(
  '/:id',
  instructorController.fetchInstructor,
  courseController.updateCourse,
);

router.patch('/:id', courseController.updateCourse);

router.post(
  '/uploadCourse',
  // courseController.timeConfig,
  instructorController.fetchInstructor,
  courseController.uploadCourse,
);

// router.post('/uploadCourse', courseController.uploadCourse);
// router.get('/sortData', courseController.sortData);

module.exports = router;

