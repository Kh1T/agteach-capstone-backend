const sgMail = require("@sendgrid/mail");

const sendEmail = (url, { email, emailVerifyCode, username }, options) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: email,
    from: process.env.EMAIL_FROM,
    subject: options.subject,
    templateId: process.env.EMAIL_TEMPLATE_ID,
    dynamicTemplateData: {
      username: username,
      code: url || emailVerifyCode,
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
