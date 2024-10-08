const sgMail = require("@sendgrid/mail");

const sendEmail = ({ email, emailVerifyCode, username, templateId }, options) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  console.log(emailVerifyCode);
  // Generate verification code
  const code = options.code ? options.code : emailVerifyCode;
  const msg = {
    to: email,
    from: process.env.EMAIL_FROM,
    subject: options.subject,
    templateId: templateId,
    dynamicTemplateData: {
      username: username,
      code,
      text: options.text,
    },
  };

  console.log(msg.dynamicTemplateData.code);

  sgMail
    .send(msg)
    .then(() => {
      console.log("Email sent successfully");
    })
    .catch((error) => {
      console.error("Error sending email:", error);
    });
};

module.exports = sendEmail;
