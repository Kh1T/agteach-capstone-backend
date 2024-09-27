const express = require('express');
const courseController = require('../controllers/courseController');
const authController = require('../controllers/authController');
const instructorController = require('../controllers/instructorController');

const router = express.Router();

router.get('/getAllCourse', courseController.getAll);
router.get('/getOneCourse/:id', courseController.getOne);
router.get('/searchData', courseController.searchData);

router.use(authController.protect);
router.post(
  '/uploadCourse',
  instructorController.uploadProfile,
  instructorController.resizeProfile,
  courseController.uploadCourse,
);

// router.get('/sortData', courseController.sortData);

module.exports = router;
