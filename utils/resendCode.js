const { getDigitalCode } = require("node-verification-code");

const sendEmail = require("../utils/sendEmail"); // Import email service

// Helper function to generate a new code and send it
async function resendCode(user) {
  const verificationCode = getDigitalCode(4); // Generate a new 4-digit verification code
  user.emailVerifyCode = verificationCode;
  user.updatedAt = new Date(); // Explicitly update the timestamp

  // Save the new verification code to the database
  await user.save(); // Assuming Sequelize model

  // Send the new verification code via email
  await sendEmail({
    to: user.email,
    from: process.env.EMAIL_FROM,
    subject: "Resend: Your verification code",
    username: user.username,
    code: { verificationCode },
    text: `Your new verification code is ${verificationCode}. Please enter this code on the verification page to complete your registration.`,
  });

  return verificationCode; // Return the new code for logging or other purposes
}

module.exports = { resendCode };
