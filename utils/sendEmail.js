const sgMail = require("@sendgrid/mail");

const sendEmail = (options) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: options.to,
    from: options.from,
    subject: options.subject,
    templateId: process.env.EMAIL_TEMPLATE_ID,
    dynamicTemplateData: {
      username: options.username,
      code: options.code,
      text: options.text,
    },
  };
//   console.log(msg);

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
