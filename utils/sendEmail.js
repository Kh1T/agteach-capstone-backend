const sgMail = require('@sendgrid/mail');

const sendEmail = ({ email, emailVerifyCode, username }, options) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // Generate verification code
  const code = options.code ? options.code : emailVerifyCode;
  const msg = {
    to: email,
    from: process.env.EMAIL_FROM,
    subject: options.subject,
    templateId: options.templateId,
    dynamicTemplateData: {
      username: username,
      code,
      text: options.text,
    },
  };

  sgMail
    .send(msg)
    .then(() => {
      console.log('Email sent successfully');
    })
    .catch((error) => {
      console.error('Error sending email:', error);
    });
};

module.exports = sendEmail;
