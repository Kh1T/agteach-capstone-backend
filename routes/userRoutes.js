const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);

router.use(authController.protect);

router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword", authController.resetPassword);

router.post("/resend-code", authController.resendVerifyCode);
router.post("/verify-email", authController.verifyEmail);

router.patch("/updateMe", userController.updateMe);

module.exports = router;
