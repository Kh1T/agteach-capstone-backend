const sgMail = require("@sendgrid/mail");

const sendEmail = ({ email, emailVerifyCode, username }, options) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const code = options.code ? options.code : emailVerifyCode;

  console.log(code);

  const msg = {
    to: email,
    from: process.env.EMAIL_FROM,
    subject: options.subject,
    templateId: process.env.EMAIL_TEMPLATE_ID,
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
