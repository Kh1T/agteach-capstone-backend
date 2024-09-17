const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

const router = express.Router();

//  User Authentication Routes

router.post("/signup", authController.signup);
router.post("/signup/addionalInfo", authController.signupVerifyCode);
router.post("/login", authController.login);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:resetToken", authController.resetPassword);

//  Protected Routes (Requires Authentication)

router.use(authController.protect);

router.post("/resendCode", authController.resendVerifyCode);
router.post("/verifyEmail", authController.verifyEmail);

router.patch("/updateMe", userController.updateMe);

module.exports = router;
