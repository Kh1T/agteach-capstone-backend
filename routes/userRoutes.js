const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);

router.post("/resend-code", authController.resendVerifyCode);
router.post("/verify-email", authController.verifyEmail);

router.get("/test", authController.protect, (req, res) => {
  res.json({
    user: req.user,
  });
});

module.exports = router;
