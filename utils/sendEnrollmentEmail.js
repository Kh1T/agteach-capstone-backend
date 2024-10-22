const sgMail = require('@sendgrid/mail');

const sendEnrollmentEmail = ({ email, subject, content }) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log("I'm looking at this: ", process.env.SENDGRID_API_KEY);
  
  const msg = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: subject,
    html: content,
  };

  console.log("I'm looking at this: ", msg);
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
