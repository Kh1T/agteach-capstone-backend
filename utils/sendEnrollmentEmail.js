const sgMail = require('@sendgrid/mail');

const sendEnrollmentEmail = ({ email, content }) => {
  const subject = 'Course Enrollment Successful';
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject,
    html: content,
  };
  console.log(msg);

  sgMail
    .send(msg)
    .then(() => {
      console.log('Email sent successfully');
    })
    .catch((error) => {
      console.error('Error sending email:', error);
    });
};

module.exports = sendEnrollmentEmail;
