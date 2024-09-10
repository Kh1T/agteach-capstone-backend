const sgMail = require("@sendgrid/mail");

const sendEmail = (options) => {

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: options.to,
    from: options.from,
    subject: options.subject,
    text: options.text,
    html: options.html,
    dynamicTemplateData: options.dynamicTemplateData,
  };

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
