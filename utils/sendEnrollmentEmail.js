const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEnrollmentEmail = async ({ email, subject, content }) => {
  const msg = {
    to: email,
    from: process.env.EMAIL_FROM,
    subject: subject,
    html: content,
  };

  await sgMail
    .send(msg)
    .then(() => {
      console.log('Email sent successfully');
    })
    .catch((error) => {
      console.error('Error sending email:', error);
    });
};

module.exports = sendEnrollmentEmail;
