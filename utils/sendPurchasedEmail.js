const sgMail = require('@sendgrid/mail');

const sendPurchasedEmail = ({ email, content }) => {
  const subject = 'Payment Successful';
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject,
    html: content,
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

module.exports = sendPurchasedEmail;
